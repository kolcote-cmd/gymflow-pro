alter table public.productos add column if not exists descripcion text;
create table public.negocio_config (id int primary key default 1 check(id=1), nombre text not null default 'IronCore Gym', descripcion text default '', telefono text default '', email text default '', direccion text default '');
grant select,insert,update on public.negocio_config to authenticated;
grant all on public.negocio_config to service_role;
alter table public.negocio_config enable row level security;
create policy "staff read business" on public.negocio_config for select to authenticated using (true);
create policy "admin manage business" on public.negocio_config for all to authenticated using(public.has_role(auth.uid(),'ADMIN')) with check(public.has_role(auth.uid(),'ADMIN'));
create or replace function public.descontar_stock() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.cantidad<=0 then raise exception 'Cantidad inválida'; end if;
 update public.productos set stock_actual=stock_actual-new.cantidad where id=new.producto_id and stock_actual>=new.cantidad;
 if not found then raise exception 'Stock insuficiente'; end if;
 return new;
end $$;
create or replace function public.cobrar_venta(items jsonb, metodo text, socio uuid default null, recibido numeric default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; line record; prod public.productos%rowtype; importe numeric:=0; subtotal numeric;
begin
 if auth.uid() is null or not public.is_front(auth.uid()) then raise exception 'No autorizado'; end if;
 if metodo not in ('EFECTIVO','TARJETA','TRANSFERENCIA') then raise exception 'Método inválido'; end if;
 if jsonb_typeof(items)<>'array' or jsonb_array_length(items)=0 then raise exception 'Carrito vacío'; end if;
 perform 1 from public.caja_turnos where usuario_id=auth.uid() and cierre is null for update;
 if not found then raise exception 'Abre tu caja antes de cobrar'; end if;
 for line in select producto_id,sum(cantidad)::int cantidad from jsonb_to_recordset(items) as x(producto_id uuid,cantidad int) group by producto_id order by producto_id loop
  if line.cantidad is null or line.cantidad<=0 then raise exception 'Cantidad inválida'; end if;
  select * into prod from public.productos where id=line.producto_id for update;
  if not found or prod.stock_actual<line.cantidad then raise exception 'Stock insuficiente'; end if;
  importe:=importe+prod.precio_venta*line.cantidad;
 end loop;
 if metodo='EFECTIVO' and (recibido is null or recibido<importe) then raise exception 'Efectivo insuficiente'; end if;
 insert into public.ventas_pos(usuario_id,socio_id,total,metodo_pago) values(auth.uid(),socio,importe,metodo) returning id into v_id;
 for line in select producto_id,sum(cantidad)::int cantidad from jsonb_to_recordset(items) as x(producto_id uuid,cantidad int) group by producto_id loop
  select * into prod from public.productos where id=line.producto_id;
  insert into public.detalle_ventas_pos(venta_id,producto_id,cantidad,precio_unitario,subtotal) values(v_id,prod.id,line.cantidad,prod.precio_venta,prod.precio_venta*line.cantidad);
 end loop;
 return jsonb_build_object('id',v_id,'total',importe,'cambio',case when metodo='EFECTIVO' then recibido-importe else 0 end);
end $$;
revoke all on function public.cobrar_venta(jsonb,text,uuid,numeric) from public,anon;
grant execute on function public.cobrar_venta(jsonb,text,uuid,numeric) to authenticated;
create or replace function public.renovar_membresia(socio uuid,plan uuid,metodo text,rebaja numeric default 0) returns public.suscripciones language plpgsql security definer set search_path=public as $$
declare p public.planes_membresia%rowtype; result public.suscripciones%rowtype; inicio date;
begin
 if auth.uid() is null or not public.is_front(auth.uid()) then raise exception 'No autorizado'; end if;
 if metodo not in ('EFECTIVO','TARJETA','TRANSFERENCIA') then raise exception 'Método inválido'; end if;
 perform 1 from public.socios where id=socio and activo for update;
 if not found then raise exception 'Socio inexistente o inactivo'; end if;
 select * into p from public.planes_membresia where id=plan and activo;
 if not found then raise exception 'Plan no disponible'; end if;
 if rebaja<0 or rebaja>p.precio then raise exception 'Descuento inválido'; end if;
 select greatest(current_date,coalesce(max(fecha_fin)+1,current_date)) into inicio from public.suscripciones where socio_id=socio and estado='ACTIVA' and fecha_fin>=current_date;
 insert into public.suscripciones(socio_id,plan_id,fecha_inicio,fecha_fin,total_pagado,descuento,metodo_pago,usuario_id) values(socio,plan,inicio,inicio+p.duracion_dias-1,p.precio-rebaja,rebaja,metodo,auth.uid()) returning * into result;
 return result;
end $$;
revoke all on function public.renovar_membresia(uuid,uuid,text,numeric) from public,anon;
grant execute on function public.renovar_membresia(uuid,uuid,text,numeric) to authenticated;
create or replace function public.asignar_rol(target uuid,nuevo public.app_role) returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(912734);
 if auth.uid() is null or not public.has_role(auth.uid(),'ADMIN') then raise exception 'No autorizado'; end if;
 if not exists(select 1 from public.profiles where id=target) then raise exception 'Usuario no encontrado'; end if;
 if nuevo<>'ADMIN' and public.has_role(target,'ADMIN') and (select count(distinct user_id) from public.user_roles where role='ADMIN')<=1 then raise exception 'No puedes quitar el último administrador'; end if;
 delete from public.user_roles where user_id=target;
 insert into public.user_roles(user_id,role) values(target,nuevo);
end $$;
revoke all on function public.asignar_rol(uuid,public.app_role) from public,anon;
grant execute on function public.asignar_rol(uuid,public.app_role) to authenticated;
create unique index if not exists caja_unica_abierta on public.caja_turnos(usuario_id) where cierre is null;
create or replace function public.cerrar_caja(turno uuid,contado numeric) returns void language plpgsql security definer set search_path=public as $$
declare c public.caja_turnos%rowtype; total numeric;
begin
 if auth.uid() is null or not public.is_front(auth.uid()) then raise exception 'No autorizado'; end if;
 select * into c from public.caja_turnos where id=turno and usuario_id=auth.uid() and cierre is null for update;
 if not found or contado<0 then raise exception 'Caja no disponible o monto inválido'; end if;
 select coalesce(sum(v.total),0) into total from public.ventas_pos v where usuario_id=auth.uid() and fecha_hora>=c.apertura and metodo_pago='EFECTIVO';
 update public.caja_turnos set cierre=now(),monto_cierre=contado,total_ventas=total where id=turno;
end $$;
revoke all on function public.cerrar_caja(uuid,numeric) from public,anon;
grant execute on function public.cerrar_caja(uuid,numeric) to authenticated;
create or replace function public.validar_catalogo() returns trigger language plpgsql set search_path=public as $$
begin
 if tg_table_name='productos' then
  if new.precio_venta<0 or new.stock_actual<0 or new.stock_minimo<0 then raise exception 'Precio y stock deben ser positivos'; end if;
 else
  if new.precio<0 or new.duracion_dias<=0 then raise exception 'Precio o duración inválida'; end if;
 end if;
 return new;
end $$;
create trigger validar_productos before insert or update on public.productos for each row execute function public.validar_catalogo();
create trigger validar_planes before insert or update on public.planes_membresia for each row execute function public.validar_catalogo();
create trigger audit_productos after insert or update on public.productos for each row execute function public.log_audit();
create trigger audit_planes after insert or update on public.planes_membresia for each row execute function public.log_audit();
create trigger audit_rutinas after insert or update on public.rutinas for each row execute function public.log_audit();
create trigger audit_evaluaciones after insert or update on public.evaluaciones for each row execute function public.log_audit();