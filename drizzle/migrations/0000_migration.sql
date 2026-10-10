
create type public.app_role as enum ('ADMIN','RECEPCION','ENTRENADOR','SOCIO');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text, avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role in ('ADMIN','RECEPCION','ENTRENADOR'))
$$;
create or replace function public.is_front(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role in ('ADMIN','RECEPCION'))
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "admin profile update" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'ADMIN'));

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'ADMIN'));
create policy "admin insert roles" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'ADMIN'));
create policy "admin update roles" on public.user_roles for update to authenticated using (public.has_role(auth.uid(),'ADMIN'));
create policy "admin delete roles" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'ADMIN'));

create table public.socios (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  codigo_socio text unique not null default ('IC-' || lpad((floor(random()*900000)+100000)::text,6,'0')),
  nombres text not null, apellidos text not null, dni text unique, telefono text, email text,
  foto_url text, qr_code text unique not null default ('QR-' || replace(gen_random_uuid()::text,'-','')),
  contacto_emergencia text, notas_medicas text, alergias text, observaciones text,
  activo boolean not null default true, created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.socios to authenticated;
grant all on public.socios to service_role;
alter table public.socios enable row level security;
create policy "staff read socios" on public.socios for select to authenticated using (public.is_staff(auth.uid()) or profile_id = auth.uid());
create policy "front insert socios" on public.socios for insert to authenticated with check (public.is_front(auth.uid()));
create policy "front update socios" on public.socios for update to authenticated using (public.is_front(auth.uid()));

create table public.planes_membresia (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, duracion_dias int not null, precio numeric(10,2) not null,
  descripcion text, activo boolean not null default true
);
grant select, insert, update, delete on public.planes_membresia to authenticated;
grant all on public.planes_membresia to service_role;
alter table public.planes_membresia enable row level security;
create policy "all read planes" on public.planes_membresia for select to authenticated using (true);
create policy "admin write planes" on public.planes_membresia for all to authenticated using (public.has_role(auth.uid(),'ADMIN')) with check (public.has_role(auth.uid(),'ADMIN'));

create table public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id) on delete cascade,
  plan_id uuid not null references public.planes_membresia(id),
  fecha_inicio date not null default current_date, fecha_fin date not null,
  estado text not null default 'ACTIVA' check (estado in ('ACTIVA','VENCIDA','CANCELADA')),
  total_pagado numeric(10,2) not null default 0, descuento numeric(10,2) not null default 0,
  metodo_pago text default 'EFECTIVO', usuario_id uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.suscripciones to authenticated;
grant all on public.suscripciones to service_role;
alter table public.suscripciones enable row level security;
create policy "read subs" on public.suscripciones for select to authenticated using (public.is_staff(auth.uid()) or exists(select 1 from public.socios s where s.id=socio_id and s.profile_id=auth.uid()));
create policy "front write subs" on public.suscripciones for insert to authenticated with check (public.is_front(auth.uid()));
create policy "front update subs" on public.suscripciones for update to authenticated using (public.is_front(auth.uid()));

create table public.registros_acceso (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid references public.socios(id) on delete cascade,
  fecha_hora timestamptz not null default now(),
  estado text not null check (estado in ('PERMITIDO','DENEGADO')),
  motivo_denegado text, salida timestamptz
);
grant select, insert, update on public.registros_acceso to authenticated;
grant all on public.registros_acceso to service_role;
alter table public.registros_acceso enable row level security;
create policy "read access" on public.registros_acceso for select to authenticated using (public.is_staff(auth.uid()) or exists(select 1 from public.socios s where s.id=socio_id and s.profile_id=auth.uid()));
create policy "front insert access" on public.registros_acceso for insert to authenticated with check (public.is_front(auth.uid()));
create policy "front update access" on public.registros_acceso for update to authenticated using (public.is_front(auth.uid()));

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  codigo_barras text unique, nombre text not null, categoria text not null,
  precio_venta numeric(10,2) not null, stock_actual int not null default 0, stock_minimo int not null default 5,
  imagen text
);
grant select, insert, update, delete on public.productos to authenticated;
grant all on public.productos to service_role;
alter table public.productos enable row level security;
create policy "staff read products" on public.productos for select to authenticated using (public.is_staff(auth.uid()));
create policy "front write products" on public.productos for all to authenticated using (public.is_front(auth.uid())) with check (public.is_front(auth.uid()));

create table public.ventas_pos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid, socio_id uuid references public.socios(id) on delete set null,
  total numeric(10,2) not null, metodo_pago text not null default 'EFECTIVO',
  fecha_hora timestamptz not null default now()
);
grant select, insert on public.ventas_pos to authenticated;
grant all on public.ventas_pos to service_role;
alter table public.ventas_pos enable row level security;
create policy "front read ventas" on public.ventas_pos for select to authenticated using (public.is_front(auth.uid()));
create policy "front insert ventas" on public.ventas_pos for insert to authenticated with check (public.is_front(auth.uid()));

create table public.detalle_ventas_pos (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas_pos(id) on delete cascade,
  producto_id uuid references public.productos(id),
  cantidad int not null, precio_unitario numeric(10,2) not null, subtotal numeric(10,2) not null
);
grant select, insert on public.detalle_ventas_pos to authenticated;
grant all on public.detalle_ventas_pos to service_role;
alter table public.detalle_ventas_pos enable row level security;
create policy "front read det" on public.detalle_ventas_pos for select to authenticated using (public.is_front(auth.uid()));
create policy "front insert det" on public.detalle_ventas_pos for insert to authenticated with check (public.is_front(auth.uid()));

create or replace function public.descontar_stock() returns trigger language plpgsql security definer set search_path=public as $$
begin update public.productos set stock_actual = stock_actual - new.cantidad where id = new.producto_id; return new; end $$;
create trigger trg_descontar_stock after insert on public.detalle_ventas_pos for each row execute function public.descontar_stock();

create table public.caja_turnos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid, apertura timestamptz not null default now(), cierre timestamptz,
  monto_inicial numeric(10,2) not null default 0, monto_cierre numeric(10,2), total_ventas numeric(10,2), notas text
);
grant select, insert, update on public.caja_turnos to authenticated;
grant all on public.caja_turnos to service_role;
alter table public.caja_turnos enable row level security;
create policy "front caja" on public.caja_turnos for all to authenticated using (public.is_front(auth.uid())) with check (public.is_front(auth.uid()));

create table public.rutinas (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id) on delete cascade,
  dia text not null, grupo_muscular text not null, ejercicio text not null,
  series int not null default 4, repeticiones text not null default '10', descanso_seg int not null default 60,
  entrenador_id uuid, created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.rutinas to authenticated;
grant all on public.rutinas to service_role;
alter table public.rutinas enable row level security;
create policy "read rutinas" on public.rutinas for select to authenticated using (public.is_staff(auth.uid()) or exists(select 1 from public.socios s where s.id=socio_id and s.profile_id=auth.uid()));
create policy "trainer write rutinas" on public.rutinas for all to authenticated using (public.has_role(auth.uid(),'ENTRENADOR') or public.has_role(auth.uid(),'ADMIN')) with check (public.has_role(auth.uid(),'ENTRENADOR') or public.has_role(auth.uid(),'ADMIN'));

create table public.evaluaciones (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id) on delete cascade,
  fecha date not null default current_date, peso numeric(5,1), grasa_pct numeric(4,1), masa_muscular numeric(5,1),
  pecho numeric(5,1), cintura numeric(5,1), cadera numeric(5,1), brazo numeric(5,1), pierna numeric(5,1),
  entrenador_id uuid
);
grant select, insert, update, delete on public.evaluaciones to authenticated;
grant all on public.evaluaciones to service_role;
alter table public.evaluaciones enable row level security;
create policy "read evals" on public.evaluaciones for select to authenticated using (public.is_staff(auth.uid()) or exists(select 1 from public.socios s where s.id=socio_id and s.profile_id=auth.uid()));
create policy "trainer write evals" on public.evaluaciones for all to authenticated using (public.has_role(auth.uid(),'ENTRENADOR') or public.has_role(auth.uid(),'ADMIN')) with check (public.has_role(auth.uid(),'ENTRENADOR') or public.has_role(auth.uid(),'ADMIN'));

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid, accion text not null, tabla text, detalle text,
  fecha_hora timestamptz not null default now()
);
grant select on public.auditoria to authenticated;
grant all on public.auditoria to service_role;
alter table public.auditoria enable row level security;
create policy "admin read audit" on public.auditoria for select to authenticated using (public.has_role(auth.uid(),'ADMIN'));

create or replace function public.log_audit() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.auditoria(usuario_id, accion, tabla, detalle)
  values (auth.uid(), tg_op, tg_table_name, left(row_to_json(new)::text, 400));
  return new;
end $$;
create trigger audit_ventas after insert on public.ventas_pos for each row execute function public.log_audit();
create trigger audit_subs after insert or update on public.suscripciones for each row execute function public.log_audit();
create trigger audit_socios after insert or update on public.socios for each row execute function public.log_audit();
create trigger audit_roles after insert or update on public.user_roles for each row execute function public.log_audit();
create trigger audit_caja after insert or update on public.caja_turnos for each row execute function public.log_audit();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, email, full_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  if not exists (select 1 from public.user_roles where role='ADMIN') then
    insert into public.user_roles(user_id, role) values (new.id, 'ADMIN');
  else
    insert into public.user_roles(user_id, role) values (new.id, 'SOCIO');
  end if;
  update public.socios set profile_id = new.id where lower(email) = lower(new.email) and profile_id is null;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter publication supabase_realtime add table public.registros_acceso;

-- SEED
insert into public.planes_membresia(nombre,duracion_dias,precio,descripcion) values
('Pase Diario',1,5,'Acceso por un día a sala de pesas y cardio'),
('Mensual Básico',30,35,'Acceso ilimitado en horario regular'),
('Trimestral Pro',90,90,'Acceso total + 1 evaluación corporal mensual'),
('Anual VIP',365,300,'Acceso 24/7, clases, rutinas personalizadas y lockers');

insert into public.socios(codigo_socio,nombres,apellidos,dni,telefono,email,foto_url,contacto_emergencia,notas_medicas,activo) values
('IC-100001','Carlos','Méndez','45871236','+502 5512 3401','carlos.mendez@mail.com','https://i.pravatar.cc/200?img=12','Ana Méndez +502 5512 0001',null,true),
('IC-100002','María','López','45871237','+502 5512 3402','maria.lopez@mail.com','https://i.pravatar.cc/200?img=47','Luis López +502 5512 0002','Asma leve',true),
('IC-100003','Jorge','Ramírez','45871238','+502 5512 3403','jorge.ramirez@mail.com','https://i.pravatar.cc/200?img=13',null,null,true),
('IC-100004','Lucía','Herrera','45871239','+502 5512 3404','lucia.herrera@mail.com','https://i.pravatar.cc/200?img=45',null,null,true),
('IC-100005','Andrés','Castillo','45871240','+502 5512 3405','andres.castillo@mail.com','https://i.pravatar.cc/200?img=14',null,'Lesión de rodilla 2024',true),
('IC-100006','Sofía','Morales','45871241','+502 5512 3406','sofia.morales@mail.com','https://i.pravatar.cc/200?img=44',null,null,true),
('IC-100007','Diego','Pérez','45871242','+502 5512 3407','diego.perez@mail.com','https://i.pravatar.cc/200?img=15',null,null,true),
('IC-100008','Valeria','García','45871243','+502 5512 3408','valeria.garcia@mail.com','https://i.pravatar.cc/200?img=43',null,null,true),
('IC-100009','Ricardo','Flores','45871244','+502 5512 3409','ricardo.flores@mail.com','https://i.pravatar.cc/200?img=33',null,'Hipertensión controlada',true),
('IC-100010','Daniela','Ruiz','45871245','+502 5512 3410','daniela.ruiz@mail.com','https://i.pravatar.cc/200?img=41',null,null,true),
('IC-100011','Fernando','Vargas','45871246','+502 5512 3411','fernando.vargas@mail.com','https://i.pravatar.cc/200?img=51',null,null,true),
('IC-100012','Camila','Ortiz','45871247','+502 5512 3412','camila.ortiz@mail.com','https://i.pravatar.cc/200?img=49',null,null,true),
('IC-100013','Pablo','Navarro','45871248','+502 5512 3413','pablo.navarro@mail.com','https://i.pravatar.cc/200?img=52',null,null,false),
('IC-100014','Gabriela','Reyes','45871249','+502 5512 3414','gabriela.reyes@mail.com','https://i.pravatar.cc/200?img=38',null,null,true),
('IC-100015','Martín','Cruz','45871250','+502 5512 3415','martin.cruz@mail.com','https://i.pravatar.cc/200?img=53',null,null,true);

-- active subs (various), expiring, expired
insert into public.suscripciones(socio_id,plan_id,fecha_inicio,fecha_fin,estado,total_pagado,metodo_pago,created_at)
select s.id, p.id, current_date - x.ago, current_date - x.ago + p.duracion_dias, case when current_date - x.ago + p.duracion_dias >= current_date then 'ACTIVA' else 'VENCIDA' end, p.precio, x.met, now() - (x.ago || ' days')::interval
from (values
 ('IC-100001','Anual VIP',40,'TARJETA'),('IC-100002','Mensual Básico',10,'EFECTIVO'),('IC-100003','Trimestral Pro',20,'TRANSFERENCIA'),
 ('IC-100004','Mensual Básico',26,'EFECTIVO'),('IC-100005','Mensual Básico',28,'TARJETA'),('IC-100006','Trimestral Pro',85,'TARJETA'),
 ('IC-100007','Mensual Básico',45,'EFECTIVO'),('IC-100008','Anual VIP',100,'TRANSFERENCIA'),('IC-100009','Mensual Básico',60,'EFECTIVO'),
 ('IC-100010','Mensual Básico',3,'TARJETA'),('IC-100011','Trimestral Pro',5,'EFECTIVO'),('IC-100012','Mensual Básico',35,'EFECTIVO'),
 ('IC-100013','Mensual Básico',120,'EFECTIVO'),('IC-100014','Mensual Básico',1,'TARJETA'),('IC-100015','Trimestral Pro',150,'EFECTIVO')
) as x(cod,plan,ago,met)
join public.socios s on s.codigo_socio=x.cod join public.planes_membresia p on p.nombre=x.plan;

-- historic subs revenue over months
insert into public.suscripciones(socio_id,plan_id,fecha_inicio,fecha_fin,estado,total_pagado,metodo_pago,created_at)
select s.id, p.id, current_date - (m*30+10), current_date - (m*30+10) + 30, 'VENCIDA', p.precio, 'EFECTIVO', now() - ((m*30+10)||' days')::interval
from public.socios s cross join generate_series(1,5) m join public.planes_membresia p on p.nombre='Mensual Básico'
where (hashtext(s.codigo_socio||m) % 3) <> 0;

-- access logs today and recent
insert into public.registros_acceso(socio_id,fecha_hora,estado,motivo_denegado)
select s.id, date_trunc('day', now()) + (h || ' hours')::interval + ((abs(hashtext(s.id::text||h)) % 59) || ' minutes')::interval,
  'PERMITIDO', null
from public.socios s cross join (values (6),(7),(8),(12),(17),(18),(19),(20)) hh(h)
where s.activo and (abs(hashtext(s.codigo_socio||h)) % 3) = 0
  and date_trunc('day', now()) + (h || ' hours')::interval < now();
insert into public.registros_acceso(socio_id,fecha_hora,estado,motivo_denegado)
select s.id, now() - interval '25 minutes', 'DENEGADO', 'Membresía vencida' from public.socios s where s.codigo_socio in ('IC-100007','IC-100009');
insert into public.registros_acceso(socio_id,fecha_hora,estado)
select s.id, now() - ((10 + row_number() over ())*7 || ' minutes')::interval, 'PERMITIDO' from public.socios s where s.codigo_socio in ('IC-100001','IC-100002','IC-100003','IC-100004','IC-100006','IC-100008','IC-100010','IC-100011');
-- past days
insert into public.registros_acceso(socio_id,fecha_hora,estado)
select s.id, date_trunc('day', now()) - (d||' days')::interval + ((6 + abs(hashtext(s.id::text||d)) % 15)||' hours')::interval, 'PERMITIDO'
from public.socios s cross join generate_series(1,14) d where s.activo and abs(hashtext(s.codigo_socio||d)) % 2 = 0;

insert into public.productos(codigo_barras,nombre,categoria,precio_venta,stock_actual,stock_minimo,imagen) values
('750100000001','Whey Protein Isolate 2lb','Suplementos',45,18,5,'protein'),
('750100000002','Creatina Monohidratada 300g','Suplementos',28,4,6,'creatine'),
('750100000003','Pre-Workout Nitro 30 serv','Suplementos',32,9,5,'protein'),
('750100000004','BCAA 2:1:1 Limón','Suplementos',24,12,5,'creatine'),
('750100000005','Bebida Isotónica 600ml','Bebidas',2.5,48,20,'drink'),
('750100000006','Agua Mineral 1L','Bebidas',1.5,15,24,'drink'),
('750100000007','Energy Drink Zero','Bebidas',3,30,12,'drink'),
('750100000008','Barra Proteica Choco 60g','Barras',3.5,40,15,'bar'),
('750100000009','Barra Energética Avena','Barras',2,8,15,'bar'),
('750100000010','Guantes de Entrenamiento','Accesorios',18,10,4,'gloves'),
('750100000011','Shaker IronCore 700ml','Accesorios',9,22,6,'gloves'),
('750100000012','Toalla Microfibra','Accesorios',7,3,5,'gloves');

-- POS sales history
with v as (
  insert into public.ventas_pos(total,metodo_pago,fecha_hora)
  select 0, (array['EFECTIVO','TARJETA','TRANSFERENCIA'])[1 + (g % 3)], now() - ((g * 37) || ' hours')::interval
  from generate_series(0,110) g returning id, fecha_hora
)
insert into public.detalle_ventas_pos(venta_id,producto_id,cantidad,precio_unitario,subtotal)
select v.id, p.id, 1 + abs(hashtext(v.id::text)) % 3, p.precio_venta, p.precio_venta * (1 + abs(hashtext(v.id::text)) % 3)
from v join lateral (select * from public.productos order by md5(v.id::text || id::text) limit 2) p on true;
update public.ventas_pos vp set total = (select coalesce(sum(subtotal),0) from public.detalle_ventas_pos d where d.venta_id = vp.id);
-- restore stock after seed sales trigger
update public.productos p set stock_actual = x.s from (values
('750100000001',18),('750100000002',4),('750100000003',9),('750100000004',12),('750100000005',48),('750100000006',15),
('750100000007',30),('750100000008',40),('750100000009',8),('750100000010',10),('750100000011',22),('750100000012',3)) x(c,s) where p.codigo_barras=x.c;

insert into public.rutinas(socio_id,dia,grupo_muscular,ejercicio,series,repeticiones,descanso_seg)
select s.id, r.dia, r.g, r.e, r.se, r.re, r.de from public.socios s cross join (values
('A','Pecho','Press banca plano',4,'8-10',90),('A','Pecho','Aperturas inclinadas',3,'12',60),('A','Tríceps','Fondos en paralelas',3,'10',60),
('B','Espalda','Dominadas',4,'8',90),('B','Espalda','Remo con barra',4,'10',75),('B','Bíceps','Curl martillo',3,'12',60),
('C','Piernas','Sentadilla libre',5,'6-8',120),('C','Piernas','Prensa 45°',4,'12',90),('C','Hombros','Press militar',4,'10',75)
) r(dia,g,e,se,re,de) where s.codigo_socio in ('IC-100001','IC-100002','IC-100003');

insert into public.evaluaciones(socio_id,fecha,peso,grasa_pct,masa_muscular,pecho,cintura,cadera,brazo,pierna)
select s.id, current_date - (m*30), 82 - (5-m)*0.0 + m*1.2, 18 + m*0.9, 36 - m*0.5, 102, 86 + m, 98, 36 - m*0.3, 58
from public.socios s cross join generate_series(0,5) m where s.codigo_socio in ('IC-100001','IC-100002','IC-100003');
