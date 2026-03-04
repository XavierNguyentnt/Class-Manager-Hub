--
-- PostgreSQL database dump
--

\restrict WcsfD0hGgxgO0L5JIbtNIUIkuYAMC42CCjWlWkHoDhln9r8XfaMXTgS8BYdPuAH

-- Dumped from database version 17.8 (6108b59)
-- Dumped by pg_dump version 18.1

-- Started on 2026-03-04 23:19:06

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 16813)
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- TOC entry 3570 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- TOC entry 2 (class 3079 OID 16776)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 3571 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 943 (class 1247 OID 16932)
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.attendance_status AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE'
);


ALTER TYPE public.attendance_status OWNER TO neondb_owner;

--
-- TOC entry 940 (class 1247 OID 16926)
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.transaction_type AS ENUM (
    'INCOME',
    'EXPENSE'
);


ALTER TYPE public.transaction_type OWNER TO neondb_owner;

--
-- TOC entry 937 (class 1247 OID 16919)
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'TEACHER',
    'CLASS_MONITOR',
    'ADMIN'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

--
-- TOC entry 273 (class 1255 OID 17047)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 41045)
-- Name: attendances; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.attendances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    created_by uuid NOT NULL,
    date date NOT NULL,
    status public.attendance_status NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attendances OWNER TO neondb_owner;

--
-- TOC entry 221 (class 1259 OID 40987)
-- Name: class_monitors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.class_monitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    monitor_id uuid NOT NULL
);


ALTER TABLE public.class_monitors OWNER TO neondb_owner;

--
-- TOC entry 220 (class 1259 OID 40972)
-- Name: classes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.classes OWNER TO neondb_owner;

--
-- TOC entry 222 (class 1259 OID 41005)
-- Name: students; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    first_name text,
    last_name text,
    date_of_birth date,
    phone text,
    parent_phone text,
    nationality text,
    start_date date,
    level text,
    health_status text,
    address text,
    occupation text,
    height text,
    weight text,
    training_status text,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.students OWNER TO neondb_owner;

--
-- TOC entry 223 (class 1259 OID 41020)
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    created_by uuid NOT NULL,
    type public.transaction_type NOT NULL,
    amount numeric(12,2) NOT NULL,
    category text NOT NULL,
    description text,
    person text,
    note text,
    date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transactions_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.transactions OWNER TO neondb_owner;

--
-- TOC entry 219 (class 1259 OID 40960)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    password text NOT NULL,
    full_name text NOT NULL,
    role public.user_role DEFAULT 'TEACHER'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 3564 (class 0 OID 41045)
-- Dependencies: 224
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.attendances (id, class_id, student_id, created_by, date, status, note, created_at) FROM stdin;
\.


--
-- TOC entry 3561 (class 0 OID 40987)
-- Dependencies: 221
-- Data for Name: class_monitors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.class_monitors (id, class_id, monitor_id) FROM stdin;
\.


--
-- TOC entry 3560 (class 0 OID 40972)
-- Dependencies: 220
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.classes (id, teacher_id, name, description, created_at) FROM stdin;
b885cd33-2c27-4b5a-9891-00f34f8217d5	7139f7af-cb35-4121-bcee-c36e03ee09a4	LỚP VĨNH XUÂN CHỦ NHẬT	Vĩnh Xuân Thạch Môn - Phân đường Khai Minh Đường\nĐịa chỉ: Đình Võng Thị, 187 Trích Sài, Hà Nội\nChủ nhật hàng tuần: \n+ Mùa hè: 18h30–22h30;\n+ Mùa đông: 17:30-21:30	2026-03-04 11:50:58.981492+00
\.


--
-- TOC entry 3562 (class 0 OID 41005)
-- Dependencies: 222
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.students (id, class_id, first_name, last_name, date_of_birth, phone, parent_phone, nationality, start_date, level, health_status, address, occupation, height, weight, training_status, note, created_at) FROM stdin;
e6e34037-a420-4b69-9693-7154be9d4fce	b885cd33-2c27-4b5a-9891-00f34f8217d5	Hà Tuấn	Linh	1995-05-15	0976433390	\N	Vietnamese	2017-01-01	Sơ cấp 2	Good	Đào Tấn, Ba Đình, Hà Nội	Đào tạo	1m67-1m7	56-58kg	\N	\N	2026-03-04 15:55:23.266883+00
\.


--
-- TOC entry 3563 (class 0 OID 41020)
-- Dependencies: 223
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (id, class_id, created_by, type, amount, category, description, person, note, date, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3559 (class 0 OID 40960)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, full_name, role, created_at) FROM stdin;
7139f7af-cb35-4121-bcee-c36e03ee09a4	teacher@example.com	cGFzc3dvcmQxMjM=	Admin Teacher	TEACHER	2026-03-04 11:04:27.350283+00
02da632b-0df8-49d1-a3d1-804728938e22	admin@khaiminh.local	S2hhaW1pbmhAMjAyNg==	Administrator	ADMIN	2026-03-04 11:13:04.335115+00
\.


--
-- TOC entry 3400 (class 2606 OID 41053)
-- Name: attendances attendances_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3388 (class 2606 OID 40992)
-- Name: class_monitors class_monitors_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3385 (class 2606 OID 40980)
-- Name: classes classes_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3393 (class 2606 OID 41013)
-- Name: students students_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3398 (class 2606 OID 41030)
-- Name: transactions transactions_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3390 (class 2606 OID 40994)
-- Name: class_monitors uq_class_monitors; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT uq_class_monitors UNIQUE (class_id, monitor_id);


--
-- TOC entry 3381 (class 2606 OID 40971)
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- TOC entry 3383 (class 2606 OID 40969)
-- Name: users users_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3401 (class 1259 OID 41069)
-- Name: idx_attendances_class_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_attendances_class_id ON public.attendances USING btree (class_id);


--
-- TOC entry 3402 (class 1259 OID 41071)
-- Name: idx_attendances_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_attendances_date ON public.attendances USING btree (date);


--
-- TOC entry 3403 (class 1259 OID 41070)
-- Name: idx_attendances_student_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_attendances_student_id ON public.attendances USING btree (student_id);


--
-- TOC entry 3386 (class 1259 OID 40986)
-- Name: idx_classes_teacher_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_classes_teacher_id ON public.classes USING btree (teacher_id);


--
-- TOC entry 3391 (class 1259 OID 41019)
-- Name: idx_students_class_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_students_class_id ON public.students USING btree (class_id);


--
-- TOC entry 3394 (class 1259 OID 41041)
-- Name: idx_transactions_class_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_transactions_class_id ON public.transactions USING btree (class_id);


--
-- TOC entry 3395 (class 1259 OID 41042)
-- Name: idx_transactions_created_by; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_transactions_created_by ON public.transactions USING btree (created_by);


--
-- TOC entry 3396 (class 1259 OID 41043)
-- Name: idx_transactions_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_transactions_date ON public.transactions USING btree (date);


--
-- TOC entry 3413 (class 2620 OID 41044)
-- Name: transactions trg_transactions_set_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_transactions_set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3410 (class 2606 OID 41054)
-- Name: attendances attendances_class_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_class_id_fkey1 FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3411 (class 2606 OID 41064)
-- Name: attendances attendances_created_by_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_created_by_fkey1 FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 3412 (class 2606 OID 41059)
-- Name: attendances attendances_student_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_student_id_fkey1 FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 3405 (class 2606 OID 40995)
-- Name: class_monitors class_monitors_class_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_class_id_fkey1 FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3406 (class 2606 OID 41000)
-- Name: class_monitors class_monitors_monitor_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_monitor_id_fkey1 FOREIGN KEY (monitor_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 3404 (class 2606 OID 40981)
-- Name: classes classes_teacher_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_teacher_id_fkey1 FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 3407 (class 2606 OID 41014)
-- Name: students students_class_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_class_id_fkey1 FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3408 (class 2606 OID 41031)
-- Name: transactions transactions_class_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_class_id_fkey1 FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3409 (class 2606 OID 41036)
-- Name: transactions transactions_created_by_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey1 FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 2193 (class 826 OID 16775)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2192 (class 826 OID 16774)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2026-03-04 23:19:11

--
-- PostgreSQL database dump complete
--

\unrestrict WcsfD0hGgxgO0L5JIbtNIUIkuYAMC42CCjWlWkHoDhln9r8XfaMXTgS8BYdPuAH

