-- =========================================================================
-- ESQUEMA DE BASE DE DATOS SUPABASE - GESTOR DE VENTAS REGALERÍA TINA
-- Ejecutar este archivo completo en el "SQL Editor" de Supabase Console.
-- =========================================================================

-- 1. EXTENSIÓN PARA UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES Y ROLES DE USUARIO (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'cajero' CHECK (role IN ('admin', 'cajero')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de perfiles a todos los autenticados" 
    ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización de perfiles a administradores o al propio usuario" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Trigger para crear perfil automáticamente cuando un usuario se registra en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'cajero')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. TABLA DE PRODUCTOS (products)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || substring(uuid_generate_v4()::text from 1 for 8)),
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'Sin Marca',
    category TEXT NOT NULL,
    barcode TEXT,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a productos solo para autenticados" ON public.products FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 4. TABLA DE CLIENTES Y CUENTAS CORRIENTES (customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT ('cust-' || substring(uuid_generate_v4()::text from 1 for 8)),
    name TEXT NOT NULL,
    dni TEXT,
    address TEXT,
    phone TEXT,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a clientes solo para autenticados" ON public.customers FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 5. TABLA DE VENTAS (sales)
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY DEFAULT ('sale-' || substring(uuid_generate_v4()::text from 1 for 8)),
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Efectivo', 'Transferencia', 'Tarjeta', 'Cuenta Corriente')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    interest_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a ventas solo para autenticados" ON public.sales FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 6. TABLA DE DETALLE DE VENTAS (sale_items)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id TEXT REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a detalles de venta solo para autenticados" ON public.sale_items FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 7. TABLA DE ABONOS Y PAGOS DE CLIENTES (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT ('pay-' || substring(uuid_generate_v4()::text from 1 for 8)),
    customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'Efectivo',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a abonos solo para autenticados" ON public.payments FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 8. TABLA DE SESIONES DE CAJA (cash_sessions)
CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id TEXT PRIMARY KEY DEFAULT ('cash-' || substring(uuid_generate_v4()::text from 1 for 8)),
    user_id UUID REFERENCES public.profiles(id),
    open_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    close_amount NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a caja solo para autenticados" ON public.cash_sessions FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- =========================================================================
-- DATOS SEMILLA INICIALES DE PRODUCTOS DE REGALERÍA TINA
-- =========================================================================
INSERT INTO public.products (id, name, brand, category, barcode, cost_price, sell_price, stock, min_stock) VALUES
-- Bijouterie
('prod-101', 'Aros Argolla Filigrana Oro', 'Bijou Gold', 'Bijouterie - Aros Acero Quirúrgico (Dorados)', '7790001001015', 1500, 3800, 15, 4),
('prod-102', 'Aros Argolla Plateados Lisos', 'Bijou Silver', 'Bijouterie - Aros Acero Quirúrgico (Plateados)', '7790001001022', 1200, 2900, 20, 5),
('prod-103', 'Aros Fantasía Colgantes Cristal Oro', 'Sin Marca', 'Bijouterie - Aros Fantasía (Dorados)', '7790001001039', 1800, 4500, 10, 3),
('prod-104', 'Aros Fantasía Argolla Strass Plata', 'Sin Marca', 'Bijouterie - Aros Fantasía (Plateados)', '7790001001046', 1600, 3900, 8, 3),
('prod-105', 'Aros de Bronce Envejecido Texturado', 'Sin Marca', 'Bijouterie - Aros de Bronce', '7790001001053', 1900, 4800, 12, 4),
('prod-106', 'Cadena con Dije Corazón Circones Oro', 'Bijou Gold', 'Bijouterie - Cadenas y Dijes', '7790001001060', 2800, 6500, 6, 2),

-- Marroquinería
('prod-201', 'Cartera Eco-Cuero Doble Manija', 'Amayra', 'Marroquinería - Carteras y Bolsos', '7790002002012', 9500, 21900, 4, 2),
('prod-202', 'Billetera Doble Cierre Corta', 'Las Oreiro / Oreiro', 'Marroquinería - Billeteras Mujer', '7790002002029', 3500, 8200, 12, 3),
('prod-203', 'Billetera Cuero Ecológico Clásica', 'Everlast', 'Marroquinería - Billeteras Hombre', '7790002002036', 2900, 6800, 15, 4),
('prod-204', 'Riñonera Deportiva Grande Impermeable', 'Wilson', 'Marroquinería - Riñoneras (Grandes y Chicas)', '7790002002043', 4200, 9800, 7, 2),
('prod-205', 'Mochila Urbana Porta Notebook', 'Wanderlust', 'Marroquinería - Mochilas Urbanas', '7790002002050', 11500, 25900, 5, 2),
('prod-206', 'Mochila Infantil Personajes Lentejuelas', 'Skora', 'Marroquinería - Mochilas Infantiles', '7790002002067', 8200, 18500, 6, 2),
('prod-207', 'Lunchera Térmica Escolar', 'Trendy', 'Marroquinería - Luncheras', '7790002002074', 3800, 8900, 9, 3),
('prod-208', 'Bolso Matero Reforzado Equipado', 'Unicross', 'Marroquinería - Bolsos Materos', '7790002002081', 8900, 19500, 3, 2),
('prod-209', 'Bolso de Viaje Mediano con Cierres', 'Alpine', 'Marroquinería - Bolsos de Viaje', '7790002002098', 12800, 28900, 4, 2),
('prod-210', 'Cartuchera 2 Compartimientos', 'Influencer', 'Marroquinería - Cartucheras', '7790002002104', 1800, 4200, 14, 4),
('prod-211', 'Cinto Hombre Cuero Sintético Cosido', 'Ona Saenz', 'Marroquinería - Cintos Hombre', '7790002002111', 2100, 4900, 10, 3),
('prod-212', 'Billetera Cierre Perimetral Económica', 'Línea Económica', 'Marroquinería - Billeteras Mujer', '7790002002128', 1400, 3200, 20, 5),

-- Térmicos y Mates
('prod-301', 'Botella Térmica Acero Inox 750ml Pastel', 'Stanley', 'Regalería - Botellas y Vasos Térmicos', '7790003003019', 6500, 14900, 10, 3),
('prod-302', 'Vaso Térmico con Tapa para Café 450ml', 'Montagne', 'Regalería - Botellas y Vasos Térmicos', '7790003003026', 4800, 10900, 15, 4),
('prod-303', 'Termo de Acero Inox Balita 1L', 'Stanley', 'Regalería - Termos, Sets de Mate y Bombillas', '7790003003033', 11500, 25900, 6, 2),
('prod-304', 'Set de Mate Térmico Cuchara + Mate', 'Lumilagro', 'Regalería - Termos, Sets de Mate y Bombillas', '7790003003040', 7200, 16500, 8, 3),
('prod-305', 'Bombilla Resorte Acero Inoxidable', 'Sin Marca', 'Regalería - Termos, Sets de Mate y Bombillas', '7790003003057', 1200, 2800, 25, 5),

-- Cosméticos, Cabello y Ropa Interior
('prod-401', 'Set Bálsamo Labial e Hidratante Manos', 'Nivea', 'Regalería - Cosméticos', '7790004004016', 2200, 5100, 10, 3),
('prod-402', 'Broches Hebilla Perlas Cabello (Set x 4)', 'Pink 365', 'Regalería - Accesorios para el Cabello', '7790004004023', 900, 2300, 20, 5),
('prod-403', 'Scrunchies Satén Colores Surtidos', 'Sin Marca', 'Regalería - Accesorios para el Cabello', '7790004004030', 600, 1500, 30, 6),
('prod-501', 'Conjunto Encaje Triangulito Talle 90 (Negro)', 'Dulce Carola', 'Ropa Interior y Lencería', '7790005005013', 7500, 16500, 4, 2),
('prod-502', 'Vedetina Algodón y Lycra Talle 2 / M', 'Cocot', 'Ropa Interior y Lencería', '7790005005020', 1800, 4200, 18, 5)
ON CONFLICT (id) DO NOTHING;

-- DATOS SEMILLA DE CLIENTE MUESTRA EN CUENTA CORRIENTE
INSERT INTO public.customers (id, name, dni, address, phone, balance, created_at) VALUES
('cust-ocasional', 'Cliente Ocasional', '-', '-', '-', 0, NOW()),
('cust-101', 'María Giménez', '34567890', 'Av. San Martín 450', '3794123456', 25000, NOW() - INTERVAL '35 days')
ON CONFLICT (id) DO NOTHING;
