--
-- PostgreSQL database dump
--

\restrict v8Ud5dSAnAmgBVg8QgWEFMlIG9V9Wez8WjaydDMxTfV23dePCFdWeTURAkPsjuc

-- Dumped from database version 17.8 (6108b59)
-- Dumped by pg_dump version 17.7

-- Started on 2026-03-04 19:51:43

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
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


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
-- TOC entry 224 (class 1259 OID 24628)
-- Name: attendances; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.attendances (
    date text NOT NULL,
    status text NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now(),
    id uuid NOT NULL,
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    created_by uuid NOT NULL
);


ALTER TABLE public.attendances OWNER TO neondb_owner;

--
-- TOC entry 221 (class 1259 OID 24600)
-- Name: class_monitors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.class_monitors (
    id uuid NOT NULL,
    class_id uuid NOT NULL,
    monitor_id uuid NOT NULL
);


ALTER TABLE public.class_monitors OWNER TO neondb_owner;

--
-- TOC entry 220 (class 1259 OID 24590)
-- Name: classes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.classes (
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    id uuid NOT NULL,
    teacher_id uuid NOT NULL
);


ALTER TABLE public.classes OWNER TO neondb_owner;

--
-- TOC entry 222 (class 1259 OID 24607)
-- Name: students; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.students (
    date_of_birth text,
    phone text,
    parent_phone text,
    note text,
    created_at timestamp without time zone DEFAULT now(),
    id uuid NOT NULL,
    class_id uuid NOT NULL,
    last_name text,
    first_name text,
    nationality text,
    start_date text,
    level text,
    health_status text,
    address text,
    occupation text,
    height text,
    weight text,
    training_status text
);


ALTER TABLE public.students OWNER TO neondb_owner;

--
-- TOC entry 223 (class 1259 OID 24617)
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transactions (
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    category text NOT NULL,
    description text,
    person text,
    note text,
    date text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id uuid NOT NULL,
    class_id uuid NOT NULL,
    created_by uuid NOT NULL
);


ALTER TABLE public.transactions OWNER TO neondb_owner;

--
-- TOC entry 219 (class 1259 OID 24577)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    email text NOT NULL,
    password text NOT NULL,
    full_name text NOT NULL,
    role text DEFAULT 'TEACHER'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    id uuid NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 3546 (class 0 OID 24628)
-- Dependencies: 224
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.attendances (date, status, note, created_at, id, class_id, student_id, created_by) FROM stdin;
\.


--
-- TOC entry 3543 (class 0 OID 24600)
-- Dependencies: 221
-- Data for Name: class_monitors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.class_monitors (id, class_id, monitor_id) FROM stdin;
\.


--
-- TOC entry 3542 (class 0 OID 24590)
-- Dependencies: 220
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.classes (name, description, created_at, id, teacher_id) FROM stdin;
IELTS Mastery 2026	Intensive IELTS preparation class	2026-03-04 11:04:27.408837	99f6f1e6-e367-446f-8f7e-86ad35bdfacf	7139f7af-cb35-4121-bcee-c36e03ee09a4
LỚP VĨNH XUÂN CHỦ NHẬT	Vĩnh Xuân Thạch Môn - Phân đường Khai Minh Đường\nĐịa chỉ: Đình Võng Thị, 187 Trích Sài, Hà Nội\nChủ nhật hàng tuần: \n+ Mùa hè: 18h30–22h30;\n+ Mùa đông: 17:30-21:30	2026-03-04 11:50:58.981492	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22
\.


--
-- TOC entry 3544 (class 0 OID 24607)
-- Dependencies: 222
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.students (date_of_birth, phone, parent_phone, note, created_at, id, class_id, last_name, first_name, nationality, start_date, level, health_status, address, occupation, height, weight, training_status) FROM stdin;
\.


--
-- TOC entry 3545 (class 0 OID 24617)
-- Dependencies: 223
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (type, amount, category, description, person, note, date, created_at, updated_at, id, class_id, created_by) FROM stdin;
INCOME	5000000.00	Tuition	Tuition fee for March	Nguyen Van A		2026-03-04	2026-03-04 11:04:27.579312	2026-03-04 11:04:27.579312	f689420e-94ad-4302-ba92-8d0a379de067	99f6f1e6-e367-446f-8f7e-86ad35bdfacf	7139f7af-cb35-4121-bcee-c36e03ee09a4
EXPENSE	500000.00	Materials	Books and printing	Bookstore		2026-03-04	2026-03-04 11:04:27.73139	2026-03-04 11:04:27.73139	563786dc-6245-48eb-9bbf-53acff591c13	99f6f1e6-e367-446f-8f7e-86ad35bdfacf	7139f7af-cb35-4121-bcee-c36e03ee09a4
\.


--
-- TOC entry 3541 (class 0 OID 24577)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (email, password, full_name, role, created_at, id) FROM stdin;
teacher@example.com	cGFzc3dvcmQxMjM=	Admin Teacher	TEACHER	2026-03-04 11:04:27.350283	7139f7af-cb35-4121-bcee-c36e03ee09a4
admin@khaiminh.local	S2hhaW1pbmhAMjAyNg==	Administrator	ADMIN	2026-03-04 11:13:04.335115	02da632b-0df8-49d1-a3d1-804728938e22
\.


--
-- TOC entry 3386 (class 2606 OID 32777)
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- TOC entry 3380 (class 2606 OID 32779)
-- Name: class_monitors class_monitors_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_pkey PRIMARY KEY (id);


--
-- TOC entry 3378 (class 2606 OID 32771)
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- TOC entry 3382 (class 2606 OID 32773)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 3384 (class 2606 OID 32775)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3374 (class 2606 OID 24588)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3376 (class 2606 OID 32769)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3393 (class 2606 OID 32800)
-- Name: attendances attendances_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3394 (class 2606 OID 32810)
-- Name: attendances attendances_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3395 (class 2606 OID 32805)
-- Name: attendances attendances_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 3388 (class 2606 OID 32815)
-- Name: class_monitors class_monitors_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3389 (class 2606 OID 32820)
-- Name: class_monitors class_monitors_monitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_monitor_id_fkey FOREIGN KEY (monitor_id) REFERENCES public.users(id);


--
-- TOC entry 3387 (class 2606 OID 32780)
-- Name: classes classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);


--
-- TOC entry 3390 (class 2606 OID 32785)
-- Name: students students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3391 (class 2606 OID 32790)
-- Name: transactions transactions_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3392 (class 2606 OID 32795)
-- Name: transactions transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


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


-- Completed on 2026-03-04 19:51:48

--
-- PostgreSQL database dump complete
--

\unrestrict v8Ud5dSAnAmgBVg8QgWEFMlIG9V9Wez8WjaydDMxTfV23dePCFdWeTURAkPsjuc

