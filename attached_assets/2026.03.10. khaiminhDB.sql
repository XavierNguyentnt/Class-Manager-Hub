--
-- PostgreSQL database dump
--

\restrict HNn0ymGTHI7MpNPlWYwuWhRsQ4ZgwIRlrhKHxgI4LNaGliorv3FnGvJSRGPHaNc

-- Dumped from database version 17.8 (6108b59)
-- Dumped by pg_dump version 17.7

-- Started on 2026-03-10 19:37:00

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
-- TOC entry 3610 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 946 (class 1247 OID 16932)
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.attendance_status AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE'
);


ALTER TYPE public.attendance_status OWNER TO neondb_owner;

--
-- TOC entry 943 (class 1247 OID 16926)
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.transaction_type AS ENUM (
    'INCOME',
    'EXPENSE'
);


ALTER TYPE public.transaction_type OWNER TO neondb_owner;

--
-- TOC entry 940 (class 1247 OID 16919)
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'TEACHER',
    'CLASS_MONITOR',
    'ADMIN'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

--
-- TOC entry 276 (class 1255 OID 17047)
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
    monitor_id uuid NOT NULL,
    monitor_role text DEFAULT 'CLASS_MONITOR'::text NOT NULL
);


ALTER TABLE public.class_monitors OWNER TO neondb_owner;

--
-- TOC entry 226 (class 1259 OID 65536)
-- Name: class_off_days; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.class_off_days (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    date text NOT NULL,
    reason text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.class_off_days OWNER TO neondb_owner;

--
-- TOC entry 225 (class 1259 OID 49152)
-- Name: class_teachers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.class_teachers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    teacher_role text DEFAULT 'ASSISTANT_TEACHER'::text NOT NULL
);


ALTER TABLE public.class_teachers OWNER TO neondb_owner;

--
-- TOC entry 220 (class 1259 OID 40972)
-- Name: classes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    schedule_days jsonb
);


ALTER TABLE public.classes OWNER TO neondb_owner;

--
-- TOC entry 227 (class 1259 OID 81920)
-- Name: student_suspensions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.student_suspensions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    effective_from text NOT NULL,
    effective_to text,
    note text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.student_suspensions OWNER TO neondb_owner;

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
    height double precision,
    weight double precision,
    training_status text,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    gender text,
    suspend_from text
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
    applied_period text,
    student_id uuid,
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
-- TOC entry 3601 (class 0 OID 41045)
-- Dependencies: 224
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.attendances (id, class_id, student_id, created_by, date, status, note, created_at) FROM stdin;
5de6f989-cfa9-4c73-88f4-8daf33afed50	b885cd33-2c27-4b5a-9891-00f34f8217d5	0c42390e-a605-4a14-a4b8-cf9e4a18a326	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	PRESENT	\N	2026-03-06 12:52:57.302558+00
d06541d9-4721-49e0-b4ad-a1798e87bfc5	b885cd33-2c27-4b5a-9891-00f34f8217d5	ece181e6-abc2-457c-ab07-a19967f33849	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	PRESENT	\N	2026-03-06 12:52:57.302558+00
5730993f-c9fe-4516-85d7-c97b2caa89be	b885cd33-2c27-4b5a-9891-00f34f8217d5	b50b8370-0e51-42f8-9554-e919c0bb6ebd	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	ABSENT	\N	2026-03-06 12:52:57.302558+00
fc080a47-4ed8-4d6e-acd2-0e3bb3d1401e	b885cd33-2c27-4b5a-9891-00f34f8217d5	ca4cdda1-d683-427e-81e2-4971c1d3014e	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	PRESENT	\N	2026-03-06 12:52:57.302558+00
d25c4e92-b4b6-4390-8da2-932b092d2ed1	b885cd33-2c27-4b5a-9891-00f34f8217d5	e2b98f34-4b52-47fb-bccd-8cf92c04ccf1	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	PRESENT	\N	2026-03-06 12:52:57.302558+00
89afe196-8d83-4464-a351-5a7ca20879e2	b885cd33-2c27-4b5a-9891-00f34f8217d5	72c83544-1237-409c-9552-ab0c72fea3f8	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	ABSENT	\N	2026-03-06 12:52:57.302558+00
b70f74a4-853f-4fde-9dd4-1c57f106c5e9	b885cd33-2c27-4b5a-9891-00f34f8217d5	e6e34037-a420-4b69-9693-7154be9d4fce	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	ABSENT	\N	2026-03-06 12:52:57.302558+00
1f124826-9bf8-4038-b039-a7ffba1bcc61	b885cd33-2c27-4b5a-9891-00f34f8217d5	c195094d-b91b-48c6-8d1a-032534c4b5eb	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	PRESENT	\N	2026-03-06 12:52:57.302558+00
a57dd21b-b0a6-4053-9ec0-13cc32a1e524	b885cd33-2c27-4b5a-9891-00f34f8217d5	55fa61cb-0704-4870-bf57-248da426a665	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	PRESENT	\N	2026-03-06 12:52:57.302558+00
ba5c858d-1cc9-4b57-b79d-a75fb490c999	b885cd33-2c27-4b5a-9891-00f34f8217d5	8ddacf86-390f-4bb1-a8b7-5ca29ebb69cc	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	PRESENT	\N	2026-03-06 12:52:57.302558+00
12833a8c-8a11-4f79-a248-8c152e8497be	b885cd33-2c27-4b5a-9891-00f34f8217d5	5f30ebbe-fa09-42a4-bf92-6c45f0df1466	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	PRESENT	\N	2026-03-06 12:52:57.302558+00
750be548-47a0-4519-8070-33e9fe35c343	b885cd33-2c27-4b5a-9891-00f34f8217d5	bdc120fb-c3b7-4521-b7bb-33f9a7a02a80	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-04	PRESENT	\N	2026-03-06 12:52:57.302558+00
4d1d0fd6-e6aa-4064-8751-b33b5fc039d4	b885cd33-2c27-4b5a-9891-00f34f8217d5	0c42390e-a605-4a14-a4b8-cf9e4a18a326	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	ABSENT	\N	2026-03-06 12:54:38.920306+00
4c78b30f-cf00-4831-add6-70a09122beea	b885cd33-2c27-4b5a-9891-00f34f8217d5	ece181e6-abc2-457c-ab07-a19967f33849	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	ABSENT	\N	2026-03-06 12:54:38.920306+00
45a0c2b0-7b61-46ea-9309-cd496b7d93c0	b885cd33-2c27-4b5a-9891-00f34f8217d5	b50b8370-0e51-42f8-9554-e919c0bb6ebd	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	ABSENT	\N	2026-03-06 12:54:38.920306+00
a2b7832c-cafc-402f-8419-0cfa4742bc65	b885cd33-2c27-4b5a-9891-00f34f8217d5	ca4cdda1-d683-427e-81e2-4971c1d3014e	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	PRESENT	\N	2026-03-06 12:54:38.920306+00
284e04ae-8075-45ed-8745-f708f92c596f	b885cd33-2c27-4b5a-9891-00f34f8217d5	e2b98f34-4b52-47fb-bccd-8cf92c04ccf1	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	PRESENT	\N	2026-03-06 12:54:38.920306+00
f8c62056-6e35-4374-9330-b1767a970988	b885cd33-2c27-4b5a-9891-00f34f8217d5	72c83544-1237-409c-9552-ab0c72fea3f8	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	PRESENT	\N	2026-03-06 12:54:38.920306+00
939149f6-cc66-495e-accd-dda5127d4368	b885cd33-2c27-4b5a-9891-00f34f8217d5	e6e34037-a420-4b69-9693-7154be9d4fce	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	PRESENT	\N	2026-03-06 12:54:38.920306+00
42a426d2-d4f9-4e9c-a1a3-554dd4b729d7	b885cd33-2c27-4b5a-9891-00f34f8217d5	c195094d-b91b-48c6-8d1a-032534c4b5eb	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	PRESENT	\N	2026-03-06 12:54:38.920306+00
74238f7d-bdb4-4985-9fe1-2068efbe3d81	b885cd33-2c27-4b5a-9891-00f34f8217d5	55fa61cb-0704-4870-bf57-248da426a665	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	ABSENT	\N	2026-03-06 12:54:38.920306+00
1624b49d-4ba6-48a9-80c0-a51ec662fe68	b885cd33-2c27-4b5a-9891-00f34f8217d5	8ddacf86-390f-4bb1-a8b7-5ca29ebb69cc	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	PRESENT	\N	2026-03-06 12:54:38.920306+00
3e9f6bd6-2131-4df6-a464-6c16f2fb28bf	b885cd33-2c27-4b5a-9891-00f34f8217d5	5f30ebbe-fa09-42a4-bf92-6c45f0df1466	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	PRESENT	\N	2026-03-06 12:54:38.920306+00
8b3998a9-e4f3-4c69-ad62-e2525324455b	b885cd33-2c27-4b5a-9891-00f34f8217d5	bdc120fb-c3b7-4521-b7bb-33f9a7a02a80	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-11	PRESENT	\N	2026-03-06 12:54:38.920306+00
58c7cb99-0443-4323-8cb8-069003632b0b	b885cd33-2c27-4b5a-9891-00f34f8217d5	0c42390e-a605-4a14-a4b8-cf9e4a18a326	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	ABSENT	\N	2026-03-06 12:56:59.183284+00
b6690f49-c647-4e9f-9b35-af00d7f0b0c4	b885cd33-2c27-4b5a-9891-00f34f8217d5	ece181e6-abc2-457c-ab07-a19967f33849	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	PRESENT	\N	2026-03-06 12:56:59.183284+00
79885b99-1f8d-40ef-b744-d5bfd4c253f4	b885cd33-2c27-4b5a-9891-00f34f8217d5	ca4cdda1-d683-427e-81e2-4971c1d3014e	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	PRESENT	\N	2026-03-06 12:56:59.183284+00
14d084e9-67c6-4f99-96a9-8ed625fefba6	b885cd33-2c27-4b5a-9891-00f34f8217d5	e2b98f34-4b52-47fb-bccd-8cf92c04ccf1	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	PRESENT	\N	2026-03-06 12:56:59.183284+00
e480282c-7ed7-4549-b27c-9e620ddf6c18	b885cd33-2c27-4b5a-9891-00f34f8217d5	72c83544-1237-409c-9552-ab0c72fea3f8	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	PRESENT	\N	2026-03-06 12:56:59.183284+00
a15e99ed-b4e8-4b20-a35b-f758e99dbcaf	b885cd33-2c27-4b5a-9891-00f34f8217d5	e6e34037-a420-4b69-9693-7154be9d4fce	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	PRESENT	\N	2026-03-06 12:56:59.183284+00
08a0f35a-7405-4f5b-9bc6-7d86f35a59b8	b885cd33-2c27-4b5a-9891-00f34f8217d5	c195094d-b91b-48c6-8d1a-032534c4b5eb	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	PRESENT	\N	2026-03-06 12:56:59.183284+00
0d18a74d-5437-4faf-985c-e4c69d4e2365	b885cd33-2c27-4b5a-9891-00f34f8217d5	55fa61cb-0704-4870-bf57-248da426a665	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	ABSENT	\N	2026-03-06 12:56:59.183284+00
589e81fa-4ab9-4b55-9723-d1b63f7bd13e	b885cd33-2c27-4b5a-9891-00f34f8217d5	8ddacf86-390f-4bb1-a8b7-5ca29ebb69cc	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	PRESENT	\N	2026-03-06 12:56:59.183284+00
fa00054b-0fa7-4871-9c0b-dcf5351b600d	b885cd33-2c27-4b5a-9891-00f34f8217d5	5f30ebbe-fa09-42a4-bf92-6c45f0df1466	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	PRESENT	\N	2026-03-06 12:56:59.183284+00
b1eee634-3ea2-4e22-8e94-5af5635610e6	b885cd33-2c27-4b5a-9891-00f34f8217d5	bdc120fb-c3b7-4521-b7bb-33f9a7a02a80	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-18	PRESENT	\N	2026-03-06 12:56:59.183284+00
028826a3-3872-4ed8-92ce-b862a34a26f6	b885cd33-2c27-4b5a-9891-00f34f8217d5	0c42390e-a605-4a14-a4b8-cf9e4a18a326	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
a99a48cb-c3d9-4ba5-9bfc-969cf856905f	b885cd33-2c27-4b5a-9891-00f34f8217d5	ece181e6-abc2-457c-ab07-a19967f33849	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
d0e2f0b4-25d3-45f3-9f7f-f92efde176c6	b885cd33-2c27-4b5a-9891-00f34f8217d5	ca4cdda1-d683-427e-81e2-4971c1d3014e	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
8cd83aa8-7be6-4a0c-b83a-c8026de73633	b885cd33-2c27-4b5a-9891-00f34f8217d5	e2b98f34-4b52-47fb-bccd-8cf92c04ccf1	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
258e9e3e-c47a-456a-a0f9-2a5296702ead	b885cd33-2c27-4b5a-9891-00f34f8217d5	72c83544-1237-409c-9552-ab0c72fea3f8	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
3f24659a-37c4-409f-95ed-281db12f6d13	b885cd33-2c27-4b5a-9891-00f34f8217d5	e6e34037-a420-4b69-9693-7154be9d4fce	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
f132365e-da6d-40a1-8a28-e4328d579b41	b885cd33-2c27-4b5a-9891-00f34f8217d5	c195094d-b91b-48c6-8d1a-032534c4b5eb	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
a3a8646c-95dd-478f-b47f-885c705c5586	b885cd33-2c27-4b5a-9891-00f34f8217d5	55fa61cb-0704-4870-bf57-248da426a665	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
146d0edf-d876-40ff-a525-de60897efa99	b885cd33-2c27-4b5a-9891-00f34f8217d5	8ddacf86-390f-4bb1-a8b7-5ca29ebb69cc	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
8bba7970-9834-4939-9b0c-056e92a41ac4	b885cd33-2c27-4b5a-9891-00f34f8217d5	5f30ebbe-fa09-42a4-bf92-6c45f0df1466	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
9cabfd3a-6f84-4a80-a1a9-e13195405f53	b885cd33-2c27-4b5a-9891-00f34f8217d5	bdc120fb-c3b7-4521-b7bb-33f9a7a02a80	02da632b-0df8-49d1-a3d1-804728938e22	2026-01-25	PRESENT	\N	2026-03-06 12:57:24.554016+00
56f041cd-baa3-44e1-a162-fee52bf6addd	b885cd33-2c27-4b5a-9891-00f34f8217d5	0c42390e-a605-4a14-a4b8-cf9e4a18a326	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
5a552a36-ab87-4d4e-96de-bc556223499f	b885cd33-2c27-4b5a-9891-00f34f8217d5	ece181e6-abc2-457c-ab07-a19967f33849	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
c8d45288-497b-4011-8fab-fd22439701d2	b885cd33-2c27-4b5a-9891-00f34f8217d5	ca4cdda1-d683-427e-81e2-4971c1d3014e	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
89b0088e-5b41-461a-8500-c9ba86d9e0f2	b885cd33-2c27-4b5a-9891-00f34f8217d5	e2b98f34-4b52-47fb-bccd-8cf92c04ccf1	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
1c10f4a7-af4a-4656-a1aa-ff75a5da2564	b885cd33-2c27-4b5a-9891-00f34f8217d5	72c83544-1237-409c-9552-ab0c72fea3f8	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
3936ee89-1f80-4343-a936-9191a23a1d63	b885cd33-2c27-4b5a-9891-00f34f8217d5	e6e34037-a420-4b69-9693-7154be9d4fce	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
dbea5fef-4993-4ad2-8fcf-8544bca5c594	b885cd33-2c27-4b5a-9891-00f34f8217d5	c195094d-b91b-48c6-8d1a-032534c4b5eb	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
19fdc062-c192-474b-aa5d-5ab8431d131e	b885cd33-2c27-4b5a-9891-00f34f8217d5	55fa61cb-0704-4870-bf57-248da426a665	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
f160a369-5e68-47fe-a07b-7fa178975290	b885cd33-2c27-4b5a-9891-00f34f8217d5	8ddacf86-390f-4bb1-a8b7-5ca29ebb69cc	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
15dd6254-636d-4fa8-b001-6301b323c9d1	b885cd33-2c27-4b5a-9891-00f34f8217d5	5f30ebbe-fa09-42a4-bf92-6c45f0df1466	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
3441ab39-b596-49c7-9265-6323c0911bd6	b885cd33-2c27-4b5a-9891-00f34f8217d5	bdc120fb-c3b7-4521-b7bb-33f9a7a02a80	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-01	PRESENT	\N	2026-03-06 12:57:47.407509+00
031d4808-31a7-47de-afd5-3a4aa1b73934	b885cd33-2c27-4b5a-9891-00f34f8217d5	0c42390e-a605-4a14-a4b8-cf9e4a18a326	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	PRESENT	\N	2026-03-06 12:58:50.136065+00
9e0e1faa-7dd2-41dc-8bb1-ad20abb92f35	b885cd33-2c27-4b5a-9891-00f34f8217d5	ece181e6-abc2-457c-ab07-a19967f33849	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	PRESENT	\N	2026-03-06 12:58:50.136065+00
c6ea174b-a7fe-4dd2-8ae2-5702641e8230	b885cd33-2c27-4b5a-9891-00f34f8217d5	ca4cdda1-d683-427e-81e2-4971c1d3014e	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	PRESENT	\N	2026-03-06 12:58:50.136065+00
c0fa2f38-d056-4d0a-938a-cfc225b01127	b885cd33-2c27-4b5a-9891-00f34f8217d5	e2b98f34-4b52-47fb-bccd-8cf92c04ccf1	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	PRESENT	\N	2026-03-06 12:58:50.136065+00
4a0dc0fa-886f-435f-bfca-5b76ee3a57d3	b885cd33-2c27-4b5a-9891-00f34f8217d5	72c83544-1237-409c-9552-ab0c72fea3f8	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	ABSENT	\N	2026-03-06 12:58:50.136065+00
1c6e8b8f-0e28-41fc-afcb-93b4807b3815	b885cd33-2c27-4b5a-9891-00f34f8217d5	e6e34037-a420-4b69-9693-7154be9d4fce	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	ABSENT	\N	2026-03-06 12:58:50.136065+00
60faf60a-8c69-4d06-bcca-99e07bc6441e	b885cd33-2c27-4b5a-9891-00f34f8217d5	c195094d-b91b-48c6-8d1a-032534c4b5eb	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	ABSENT	\N	2026-03-06 12:58:50.136065+00
9a35aa23-5852-4b4d-9890-2c762d42f0a9	b885cd33-2c27-4b5a-9891-00f34f8217d5	55fa61cb-0704-4870-bf57-248da426a665	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	PRESENT	\N	2026-03-06 12:58:50.136065+00
dea3175c-b359-458c-b5ad-e54ccfc8fd02	b885cd33-2c27-4b5a-9891-00f34f8217d5	8ddacf86-390f-4bb1-a8b7-5ca29ebb69cc	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	ABSENT	\N	2026-03-06 12:58:50.136065+00
74030a87-1547-4a35-a69d-03b0a845aaa9	b885cd33-2c27-4b5a-9891-00f34f8217d5	5f30ebbe-fa09-42a4-bf92-6c45f0df1466	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	PRESENT	\N	2026-03-06 12:58:50.136065+00
15b2b17f-0714-406f-b8ef-070900dc04c4	b885cd33-2c27-4b5a-9891-00f34f8217d5	bdc120fb-c3b7-4521-b7bb-33f9a7a02a80	02da632b-0df8-49d1-a3d1-804728938e22	2026-02-08	ABSENT	\N	2026-03-06 12:58:50.136065+00
6e58aae7-8fd5-4f57-a7f3-5f9fb31e3fbc	b885cd33-2c27-4b5a-9891-00f34f8217d5	0c42390e-a605-4a14-a4b8-cf9e4a18a326	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	PRESENT	\N	2026-03-06 13:07:59.867333+00
41a2a726-9c53-4fba-b711-13a398c856c9	b885cd33-2c27-4b5a-9891-00f34f8217d5	ece181e6-abc2-457c-ab07-a19967f33849	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	PRESENT	\N	2026-03-06 13:07:59.867333+00
b7b167d2-8894-4347-8735-9a51716d159b	b885cd33-2c27-4b5a-9891-00f34f8217d5	ca4cdda1-d683-427e-81e2-4971c1d3014e	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	ABSENT	\N	2026-03-06 13:07:59.867333+00
84b20e9b-0126-4e92-a582-dad3a39a5d42	b885cd33-2c27-4b5a-9891-00f34f8217d5	e2b98f34-4b52-47fb-bccd-8cf92c04ccf1	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	ABSENT	\N	2026-03-06 13:07:59.867333+00
0c25dcab-f40c-4da3-9b2d-d19cb7751852	b885cd33-2c27-4b5a-9891-00f34f8217d5	72c83544-1237-409c-9552-ab0c72fea3f8	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	PRESENT	\N	2026-03-06 13:07:59.867333+00
fa686415-5478-4ca1-8c21-dcaa7ea40d4f	b885cd33-2c27-4b5a-9891-00f34f8217d5	e6e34037-a420-4b69-9693-7154be9d4fce	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	ABSENT	\N	2026-03-06 13:07:59.867333+00
61e9c19c-a4bb-4ac5-bb25-9ab20005493c	b885cd33-2c27-4b5a-9891-00f34f8217d5	c195094d-b91b-48c6-8d1a-032534c4b5eb	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	PRESENT	\N	2026-03-06 13:07:59.867333+00
9d536fcd-3cde-4bff-be39-484f79656954	b885cd33-2c27-4b5a-9891-00f34f8217d5	55fa61cb-0704-4870-bf57-248da426a665	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	PRESENT	\N	2026-03-06 13:07:59.867333+00
8d74994a-cd3e-4425-b1ee-54e30d330678	b885cd33-2c27-4b5a-9891-00f34f8217d5	8ddacf86-390f-4bb1-a8b7-5ca29ebb69cc	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	PRESENT	\N	2026-03-06 13:07:59.867333+00
c1de3bda-2e3c-467c-bf67-0e0e024c7153	b885cd33-2c27-4b5a-9891-00f34f8217d5	5f30ebbe-fa09-42a4-bf92-6c45f0df1466	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	PRESENT	\N	2026-03-06 13:07:59.867333+00
ac16a5c7-e6ec-4ac1-b433-098e48a28c4c	b885cd33-2c27-4b5a-9891-00f34f8217d5	bdc120fb-c3b7-4521-b7bb-33f9a7a02a80	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-01	ABSENT	\N	2026-03-06 13:07:59.867333+00
\.


--
-- TOC entry 3598 (class 0 OID 40987)
-- Dependencies: 221
-- Data for Name: class_monitors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.class_monitors (id, class_id, monitor_id, monitor_role) FROM stdin;
\.


--
-- TOC entry 3603 (class 0 OID 65536)
-- Dependencies: 226
-- Data for Name: class_off_days; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.class_off_days (id, class_id, date, reason, created_by, created_at) FROM stdin;
26a41fd4-fc07-4124-810c-de61682ad1fb	b885cd33-2c27-4b5a-9891-00f34f8217d5	2026-02-15	Nghỉ tết Nguyên đán	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-06 13:36:47.135042
143a3498-ba98-4415-9ea9-6e99ae1c4b9c	b885cd33-2c27-4b5a-9891-00f34f8217d5	2026-02-22	Nghỉ Tết Nguyên đán	02da632b-0df8-49d1-a3d1-804728938e22	2026-03-06 13:38:48.741485
\.


--
-- TOC entry 3602 (class 0 OID 49152)
-- Dependencies: 225
-- Data for Name: class_teachers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.class_teachers (id, class_id, teacher_id, created_at, teacher_role) FROM stdin;
a6f521b2-725d-4658-8b91-c0f69fe36735	b885cd33-2c27-4b5a-9891-00f34f8217d5	7139f7af-cb35-4121-bcee-c36e03ee09a4	2026-03-04 16:35:40.108462+00	PRIMARY_TEACHER
\.


--
-- TOC entry 3597 (class 0 OID 40972)
-- Dependencies: 220
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.classes (id, name, description, created_at, schedule_days) FROM stdin;
b885cd33-2c27-4b5a-9891-00f34f8217d5	LỚP VĨNH XUÂN CHỦ NHẬT	Vĩnh Xuân Thạch Môn - Phân đường Khai Minh Đường\nĐịa chỉ: Đình Võng Thị, 187 Trích Sài, Hà Nội\nChủ nhật hàng tuần: \n+ Mùa hè: 18h30–22h30;\n+ Mùa đông: 17:30-21:30	2026-03-04 11:50:58.981492+00	["SUN"]
\.


--
-- TOC entry 3604 (class 0 OID 81920)
-- Dependencies: 227
-- Data for Name: student_suspensions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.student_suspensions (id, class_id, student_id, effective_from, effective_to, note, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3599 (class 0 OID 41005)
-- Dependencies: 222
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.students (id, class_id, first_name, last_name, date_of_birth, phone, parent_phone, nationality, start_date, level, health_status, address, occupation, height, weight, training_status, note, created_at, gender, suspend_from) FROM stdin;
0c42390e-a605-4a14-a4b8-cf9e4a18a326	b885cd33-2c27-4b5a-9891-00f34f8217d5	Nguyễn Viết	Vinh	1993-05-12	0387542402	\N	Vietnamese	2025-11-02	\N	Good	Phố Nhật Tảo, phường Phú Thượng, Hà Nội	\N	165	62	ACTIVE	\N	2026-03-06 04:43:15.953771+00	MALE	\N
6d040a07-bd4f-4e73-9018-fcaf43ed988b	b885cd33-2c27-4b5a-9891-00f34f8217d5	Ma Thuỷ	Triều	1997-12-10	0964224162	\N	Vietnamese	2024-12-01	Nhập môn	Good	Số 56/521 Nguyễn Trãi, Thanh Xuân, HN	Sinh viên	160	45	SUSPEND	Nghỉ dài hạn	2026-03-04 17:04:44.298417+00	FEMALE	\N
ece181e6-abc2-457c-ab07-a19967f33849	b885cd33-2c27-4b5a-9891-00f34f8217d5	Romanova	Ekaterina	1995-08-06	0385638251	\N	Russian	2026-01-01	\N	Occasional pain in the knees	98 Vo Chi Cong	Architect	164	58	ACTIVE	\N	2026-03-06 04:49:31.202612+00	\N	\N
ca4cdda1-d683-427e-81e2-4971c1d3014e	b885cd33-2c27-4b5a-9891-00f34f8217d5	Trương Khánh 	Tùng	2003-09-05	0982051559	\N	Vietnamese	2025-10-01	\N	Hen suyễn	CT4 Iris Garden, Cầu Giấy, Hà Nội	Tự do	173	82	ACTIVE	\N	2026-03-06 04:42:24.790127+00	\N	\N
b50b8370-0e51-42f8-9554-e919c0bb6ebd	b885cd33-2c27-4b5a-9891-00f34f8217d5	Sidelkovskaya	Alina	1985-05-08	0327160231	\N	Russian	2025-08-01	\N	Ostheoarthritis, miniscus trauma	No. 84 Linh Lang street, Cong Vi ward, Ba Dinh district, Hanoi	Company Employee	162	60	ACTIVE	\N	2026-03-06 04:38:51.255666+00	FEMALE	\N
cdc6624b-8338-4332-9144-f161d15e9193	b885cd33-2c27-4b5a-9891-00f34f8217d5	Phạm	Phương	1998-04-03	0965813468	\N	Vietnamese	2025-01-01	Nhập môn	Good	 Tràng An complex, số 1 Phùng Chí Kiên, Cầu Giấy, Hà Nội	\N	155	50	SUSPEND	Nghỉ dài hạn	2026-03-06 04:35:03.344271+00	FEMALE	\N
e2b98f34-4b52-47fb-bccd-8cf92c04ccf1	b885cd33-2c27-4b5a-9891-00f34f8217d5	Borisenko	Anna	1994-12-21	0359663787	\N	Russian	2023-08-01	Sơ cấp 2	Good	2/245 Lac Long Quan, Tay Ho, Ha Noi	Teacher 	170	65	ACTIVE	\N	2026-03-04 17:00:22.120165+00	FEMALE	\N
72c83544-1237-409c-9552-ab0c72fea3f8	b885cd33-2c27-4b5a-9891-00f34f8217d5	Đinh Thu 	An	2003-11-10	0985381830	\N	Vietnamese	2025-09-01	\N	Good	Số 4 ngách 49 ngõ 71 phố Tân Ấp, Phúc Xá, Ba Đình, Hà Nội	Tự do	162	60	ACTIVE	\N	2026-03-06 04:41:19.597581+00	FEMALE	\N
e6e34037-a420-4b69-9693-7154be9d4fce	b885cd33-2c27-4b5a-9891-00f34f8217d5	Hà Tuấn	Linh	1995-05-15	0976433390	\N	Vietnamese	2017-01-01	Sơ cấp 2	Good	Đào Tấn, Ba Đình, Hà Nội	Đào tạo	167	58	ACTIVE	\N	2026-03-04 15:55:23.266883+00	\N	\N
c195094d-b91b-48c6-8d1a-032534c4b5eb	b885cd33-2c27-4b5a-9891-00f34f8217d5	Lê Quý	Dương	2003-08-03	0353410764	\N	Vietnamese	2025-09-01	\N	Thận đa nang	Nam An Khánh, Hoài Đức, Hà Nội	Sinh viên	178	61	ACTIVE	\N	2026-03-06 04:40:19.69585+00	MALE	\N
55fa61cb-0704-4870-bf57-248da426a665	b885cd33-2c27-4b5a-9891-00f34f8217d5	Nguyễn Ngọc	Sơn	1997-07-29	0974066627	\N	Vietnamese	2025-11-02	\N	Good	175 Nguyễn Khang, Cầu Giấy, Hà Nội	Tự do	160	55	ACTIVE	\N	2026-03-06 04:48:11.743336+00	MALE	\N
8ddacf86-390f-4bb1-a8b7-5ca29ebb69cc	b885cd33-2c27-4b5a-9891-00f34f8217d5	Nguyễn Thị Hà	Khanh	1995-08-26	0906260895	\N	Vietnamese	2024-11-01	Nhập môn	Good	287 Đồng Cổ, phường Bưởi, Tây Hồ, HN	Kinh doanh	162	55	ACTIVE	\N	2026-03-04 17:02:29.455455+00	FEMALE	\N
5f30ebbe-fa09-42a4-bf92-6c45f0df1466	b885cd33-2c27-4b5a-9891-00f34f8217d5	Nguyễn Thị Thùy 	Dung	1994-04-20	0977199974	\N	Vietnamese	2025-06-01	\N	Tình trạng sk: khí huyết yếu, thở yếu và k đều (trào ngược dạ dày thực quản)	65 đường Chùa Bụt Mọc, Phú Diễn, Hà Nội	Giáo viên tiếng Anh	160	48	ACTIVE	\N	2026-03-06 04:36:44.335108+00	FEMALE	\N
bdc120fb-c3b7-4521-b7bb-33f9a7a02a80	b885cd33-2c27-4b5a-9891-00f34f8217d5	Nguyễn Thùy	Linh	1984-09-19	0982419984	\N	Vietnamese	2025-11-02	\N	Good	Thư Lâm , Đông Anh , Hà Nội	author, spiritual coach, KD tự do	159	54	ACTIVE	\N	2026-03-06 04:46:30.184877+00	FEMALE	\N
\.


--
-- TOC entry 3600 (class 0 OID 41020)
-- Dependencies: 223
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (id, class_id, created_by, type, amount, category, description, person, note, date, created_at, updated_at, applied_period, student_id) FROM stdin;
c0a8bb51-d785-4663-98ed-ab5e0adb800e	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	187000.00	transactions.categories.other	Quỹ tháng 2 Khanh bàn giao	Nguyễn Thị Hà Khanh	\N	2026-03-03	2026-03-10 08:08:07.526131+00	2026-03-10 10:56:20.049498+00	\N	\N
df126bd0-7de2-4248-b1e6-5376dea79b6e	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	EXPENSE	180000.00	transactions.categories.expense.food	Tiền ăn ngày 01/03/2026	Nguyễn Thị Hà Khanh	\N	2026-03-01	2026-03-10 08:09:14.166226+00	2026-03-10 10:56:22.493951+00	\N	\N
57b5220f-e5fc-4292-a475-2e3ba4f46b90	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	1000000.00	transactions.categories.income.tuition	Học phí tháng 3/2026	Nguyễn Viết Vinh	\N	2026-03-05	2026-03-06 04:51:53.675902+00	2026-03-10 10:56:25.251334+00	2026-03	0c42390e-a605-4a14-a4b8-cf9e4a18a326
84ade799-1719-475f-bdd3-dfabe1b47569	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	1000000.00	transactions.categories.income.tuition	Học phí tháng 3/2026	Nguyễn Thị Thùy Dung	\N	2026-03-05	2026-03-06 04:52:26.74698+00	2026-03-10 10:56:27.634506+00	2026-03	5f30ebbe-fa09-42a4-bf92-6c45f0df1466
78b80b8f-fec8-497a-92ec-ad96d103afe9	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	1000000.00	transactions.categories.income.tuition	Học phí tháng 3/2026	Đinh Thu An	\N	2026-03-05	2026-03-06 04:52:49.045768+00	2026-03-10 10:56:33.629113+00	2026-03	72c83544-1237-409c-9552-ab0c72fea3f8
29f48923-cabd-4f2e-bfd9-6ac478ffda17	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	1000000.00	transactions.categories.income.tuition	Học phí tháng 3/2026	Romanova Ekaterina	\N	2026-03-08	2026-03-10 07:57:56.274603+00	2026-03-10 10:56:37.87747+00	2026-03	ece181e6-abc2-457c-ab07-a19967f33849
2a45007f-30c1-4594-89ed-a057ee525356	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	EXPENSE	195000.00	transactions.categories.expense.food	Tiền ăn  ngày 8/3/2026	Nguyễn Viết Vinh	\N	2026-03-08	2026-03-10 08:09:50.492443+00	2026-03-10 10:56:50.816536+00	\N	\N
4a39f528-9664-485b-9d3b-f0a8944b8940	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	500000.00	transactions.categories.income.tuition	Học phí tháng 3/2026	Hà Tuấn Linh	\N	2026-03-09	2026-03-10 07:56:31.434744+00	2026-03-10 10:56:52.968459+00	2026-03	e6e34037-a420-4b69-9693-7154be9d4fce
a2c2910c-78a5-4fc4-b903-2fcb79fc3324	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	1000000.00	transactions.categories.income.tuition	Học phí tháng 3/2026	Nguyễn Thị Hà Khanh	\N	2026-03-03	2026-03-06 02:36:54.212248+00	2026-03-10 10:56:01.075306+00	2026-03	8ddacf86-390f-4bb1-a8b7-5ca29ebb69cc
f94747ce-3a31-4b3a-ba31-661f4cbed8af	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	1000000.00	transactions.categories.income.tuition	Học phí tháng 3/2026	Nguyễn Ngọc Sơn	\N	2026-03-09	2026-03-10 07:57:09.897823+00	2026-03-10 10:56:55.344135+00	2026-03	55fa61cb-0704-4870-bf57-248da426a665
98d5a92b-aaf3-400b-9f7f-3db8aa3c32f4	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	500000.00	transactions.categories.income.tuition	Học phí tháng 2/2026	Nguyễn Ngọc Sơn	\N	2026-03-09	2026-03-10 08:02:45.031657+00	2026-03-10 10:56:58.40272+00	2026-02	55fa61cb-0704-4870-bf57-248da426a665
5f483935-06b6-4429-b8b7-7d97801628c0	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	500000.00	transactions.categories.income.tuition	Học phí tháng 2/2026	Trương Khánh Tùng	\N	2026-03-10	2026-03-10 08:02:07.954153+00	2026-03-10 10:57:01.484257+00	2026-02	ca4cdda1-d683-427e-81e2-4971c1d3014e
1ee9ea72-45bd-4b3e-bc69-bec62574ef9c	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	EXPENSE	1000000.00	transactions.categories.other	Trích quỹ viếng ông nội anh Nam	\N	\N	2026-03-10	2026-03-10 08:11:07.205973+00	2026-03-10 10:57:04.348986+00	\N	\N
28ee375e-eb12-47c0-867f-ea4b120e8d51	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	EXPENSE	5500000.00	transactions.categories.other	Chuyển khoản cho thầy Vũ	\N	\N	2026-03-10	2026-03-10 08:12:19.021209+00	2026-03-10 10:57:11.754255+00	\N	\N
847c7c59-fc23-4490-b601-2fc8175df0ad	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	500000.00	transactions.categories.income.tuition	Học phí tháng 02/2026	Nguyễn Viết Vinh	\N	2026-01-31	2026-03-10 11:45:54.643262+00	2026-03-10 11:45:54.643262+00	2026-02	0c42390e-a605-4a14-a4b8-cf9e4a18a326
1e3c32ca-7239-429c-a9e0-737e1406943c	b885cd33-2c27-4b5a-9891-00f34f8217d5	02da632b-0df8-49d1-a3d1-804728938e22	INCOME	1000000.00	transactions.categories.income.tuition	Học phí tháng 01/2026	Nguyễn Viết Vinh	\N	2026-01-31	2026-03-10 11:47:07.403943+00	2026-03-10 11:47:07.403943+00	2026-01	0c42390e-a605-4a14-a4b8-cf9e4a18a326
\.


--
-- TOC entry 3596 (class 0 OID 40960)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, full_name, role, created_at) FROM stdin;
7139f7af-cb35-4121-bcee-c36e03ee09a4	teacher@example.com	cGFzc3dvcmQxMjM=	Admin Teacher	TEACHER	2026-03-04 11:04:27.350283+00
02da632b-0df8-49d1-a3d1-804728938e22	admin@khaiminh.local	S2hhaW1pbmhAMjAyNg==	Administrator	ADMIN	2026-03-04 11:13:04.335115+00
\.


--
-- TOC entry 3420 (class 2606 OID 41053)
-- Name: attendances attendances_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3408 (class 2606 OID 40992)
-- Name: class_monitors class_monitors_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3431 (class 2606 OID 65544)
-- Name: class_off_days class_off_days_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_off_days
    ADD CONSTRAINT class_off_days_pkey PRIMARY KEY (id);


--
-- TOC entry 3425 (class 2606 OID 49160)
-- Name: class_teachers class_teachers_class_teacher_uq; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_teachers
    ADD CONSTRAINT class_teachers_class_teacher_uq UNIQUE (class_id, teacher_id);


--
-- TOC entry 3427 (class 2606 OID 49158)
-- Name: class_teachers class_teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_teachers
    ADD CONSTRAINT class_teachers_pkey PRIMARY KEY (id);


--
-- TOC entry 3406 (class 2606 OID 40980)
-- Name: classes classes_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3433 (class 2606 OID 81929)
-- Name: student_suspensions student_suspensions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_suspensions
    ADD CONSTRAINT student_suspensions_pkey PRIMARY KEY (id);


--
-- TOC entry 3413 (class 2606 OID 41013)
-- Name: students students_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3418 (class 2606 OID 41030)
-- Name: transactions transactions_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3410 (class 2606 OID 40994)
-- Name: class_monitors uq_class_monitors; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT uq_class_monitors UNIQUE (class_id, monitor_id);


--
-- TOC entry 3402 (class 2606 OID 40971)
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- TOC entry 3404 (class 2606 OID 40969)
-- Name: users users_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3421 (class 1259 OID 41069)
-- Name: idx_attendances_class_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_attendances_class_id ON public.attendances USING btree (class_id);


--
-- TOC entry 3422 (class 1259 OID 41071)
-- Name: idx_attendances_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_attendances_date ON public.attendances USING btree (date);


--
-- TOC entry 3423 (class 1259 OID 41070)
-- Name: idx_attendances_student_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_attendances_student_id ON public.attendances USING btree (student_id);


--
-- TOC entry 3428 (class 1259 OID 49171)
-- Name: idx_class_teachers_class_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_class_teachers_class_id ON public.class_teachers USING btree (class_id);


--
-- TOC entry 3429 (class 1259 OID 49172)
-- Name: idx_class_teachers_teacher_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_class_teachers_teacher_id ON public.class_teachers USING btree (teacher_id);


--
-- TOC entry 3411 (class 1259 OID 41019)
-- Name: idx_students_class_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_students_class_id ON public.students USING btree (class_id);


--
-- TOC entry 3414 (class 1259 OID 41041)
-- Name: idx_transactions_class_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_transactions_class_id ON public.transactions USING btree (class_id);


--
-- TOC entry 3415 (class 1259 OID 41042)
-- Name: idx_transactions_created_by; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_transactions_created_by ON public.transactions USING btree (created_by);


--
-- TOC entry 3416 (class 1259 OID 41043)
-- Name: idx_transactions_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_transactions_date ON public.transactions USING btree (date);


--
-- TOC entry 3450 (class 2620 OID 41044)
-- Name: transactions trg_transactions_set_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_transactions_set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3440 (class 2606 OID 41054)
-- Name: attendances attendances_class_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_class_id_fkey1 FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3441 (class 2606 OID 41064)
-- Name: attendances attendances_created_by_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_created_by_fkey1 FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 3442 (class 2606 OID 41059)
-- Name: attendances attendances_student_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_student_id_fkey1 FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 3434 (class 2606 OID 40995)
-- Name: class_monitors class_monitors_class_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_class_id_fkey1 FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3435 (class 2606 OID 41000)
-- Name: class_monitors class_monitors_monitor_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_monitor_id_fkey1 FOREIGN KEY (monitor_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 3445 (class 2606 OID 65545)
-- Name: class_off_days class_off_days_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_off_days
    ADD CONSTRAINT class_off_days_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3446 (class 2606 OID 65550)
-- Name: class_off_days class_off_days_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_off_days
    ADD CONSTRAINT class_off_days_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3443 (class 2606 OID 49161)
-- Name: class_teachers class_teachers_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_teachers
    ADD CONSTRAINT class_teachers_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3444 (class 2606 OID 49166)
-- Name: class_teachers class_teachers_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_teachers
    ADD CONSTRAINT class_teachers_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 3447 (class 2606 OID 81930)
-- Name: student_suspensions student_suspensions_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_suspensions
    ADD CONSTRAINT student_suspensions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3448 (class 2606 OID 81940)
-- Name: student_suspensions student_suspensions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_suspensions
    ADD CONSTRAINT student_suspensions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3449 (class 2606 OID 81935)
-- Name: student_suspensions student_suspensions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_suspensions
    ADD CONSTRAINT student_suspensions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 3436 (class 2606 OID 41014)
-- Name: students students_class_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_class_id_fkey1 FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3437 (class 2606 OID 41031)
-- Name: transactions transactions_class_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_class_id_fkey1 FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 3438 (class 2606 OID 41036)
-- Name: transactions transactions_created_by_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey1 FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 3439 (class 2606 OID 73728)
-- Name: transactions transactions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- TOC entry 2205 (class 826 OID 16775)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2204 (class 826 OID 16774)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2026-03-10 19:37:08

--
-- PostgreSQL database dump complete
--

\unrestrict HNn0ymGTHI7MpNPlWYwuWhRsQ4ZgwIRlrhKHxgI4LNaGliorv3FnGvJSRGPHaNc

