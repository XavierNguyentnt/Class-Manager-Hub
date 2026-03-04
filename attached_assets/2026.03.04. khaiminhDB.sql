--
-- PostgreSQL database dump
--

\restrict losVHfVZgXFEwa8tOnlVg4IuZHusTx2kY6FtdQ51apIiR0Qd9rDTf4PGtrGniLk

-- Dumped from database version 17.8 (6108b59)
-- Dumped by pg_dump version 17.7

-- Started on 2026-03-04 18:26:28

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
-- TOC entry 3561 (class 0 OID 0)
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
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 949 (class 1247 OID 16932)
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.attendance_status AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE'
);


ALTER TYPE public.attendance_status OWNER TO neondb_owner;

--
-- TOC entry 946 (class 1247 OID 16926)
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.transaction_type AS ENUM (
    'INCOME',
    'EXPENSE'
);


ALTER TYPE public.transaction_type OWNER TO neondb_owner;

--
-- TOC entry 943 (class 1247 OID 16919)
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'TEACHER',
    'CLASS_MONITOR',
    'ADMIN'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

--
-- TOC entry 279 (class 1255 OID 17047)
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
-- TOC entry 230 (class 1259 OID 24628)
-- Name: attendances; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.attendances (
    id integer NOT NULL,
    class_id integer NOT NULL,
    student_id integer NOT NULL,
    date text NOT NULL,
    status text NOT NULL,
    note text,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.attendances OWNER TO neondb_owner;

--
-- TOC entry 229 (class 1259 OID 24627)
-- Name: attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.attendances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendances_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3563 (class 0 OID 0)
-- Dependencies: 229
-- Name: attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.attendances_id_seq OWNED BY public.attendances.id;


--
-- TOC entry 224 (class 1259 OID 24600)
-- Name: class_monitors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.class_monitors (
    id integer NOT NULL,
    class_id integer NOT NULL,
    monitor_id integer NOT NULL
);


ALTER TABLE public.class_monitors OWNER TO neondb_owner;

--
-- TOC entry 223 (class 1259 OID 24599)
-- Name: class_monitors_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.class_monitors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.class_monitors_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3564 (class 0 OID 0)
-- Dependencies: 223
-- Name: class_monitors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.class_monitors_id_seq OWNED BY public.class_monitors.id;


--
-- TOC entry 222 (class 1259 OID 24590)
-- Name: classes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    teacher_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.classes OWNER TO neondb_owner;

--
-- TOC entry 221 (class 1259 OID 24589)
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3565 (class 0 OID 0)
-- Dependencies: 221
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- TOC entry 226 (class 1259 OID 24607)
-- Name: students; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.students (
    id integer NOT NULL,
    full_name text NOT NULL,
    date_of_birth text,
    phone text,
    parent_phone text,
    note text,
    class_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.students OWNER TO neondb_owner;

--
-- TOC entry 225 (class 1259 OID 24606)
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3566 (class 0 OID 0)
-- Dependencies: 225
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- TOC entry 228 (class 1259 OID 24617)
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    class_id integer NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    category text NOT NULL,
    description text,
    person text,
    note text,
    date text NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.transactions OWNER TO neondb_owner;

--
-- TOC entry 227 (class 1259 OID 24616)
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3567 (class 0 OID 0)
-- Dependencies: 227
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- TOC entry 220 (class 1259 OID 24577)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    full_name text NOT NULL,
    role text DEFAULT 'TEACHER'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 219 (class 1259 OID 24576)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3568 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3383 (class 2604 OID 24631)
-- Name: attendances id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances ALTER COLUMN id SET DEFAULT nextval('public.attendances_id_seq'::regclass);


--
-- TOC entry 3377 (class 2604 OID 24603)
-- Name: class_monitors id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors ALTER COLUMN id SET DEFAULT nextval('public.class_monitors_id_seq'::regclass);


--
-- TOC entry 3375 (class 2604 OID 24593)
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- TOC entry 3378 (class 2604 OID 24610)
-- Name: students id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- TOC entry 3380 (class 2604 OID 24620)
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- TOC entry 3372 (class 2604 OID 24580)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3555 (class 0 OID 24628)
-- Dependencies: 230
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.attendances (id, class_id, student_id, date, status, note, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 3549 (class 0 OID 24600)
-- Dependencies: 224
-- Data for Name: class_monitors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.class_monitors (id, class_id, monitor_id) FROM stdin;
\.


--
-- TOC entry 3547 (class 0 OID 24590)
-- Dependencies: 222
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.classes (id, name, description, teacher_id, created_at) FROM stdin;
1	IELTS Mastery 2026	Intensive IELTS preparation class	1	2026-03-04 11:04:27.408837
\.


--
-- TOC entry 3551 (class 0 OID 24607)
-- Dependencies: 226
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.students (id, full_name, date_of_birth, phone, parent_phone, note, class_id, created_at) FROM stdin;
1	Nguyen Van A	2000-01-01	0123456789	\N	Good student	1	2026-03-04 11:04:27.467765
2	Tran Thi B	2001-05-15	0987654321	0999888777		1	2026-03-04 11:04:27.52533
\.


--
-- TOC entry 3553 (class 0 OID 24617)
-- Dependencies: 228
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (id, class_id, type, amount, category, description, person, note, date, created_by, created_at, updated_at) FROM stdin;
1	1	INCOME	5000000.00	Tuition	Tuition fee for March	Nguyen Van A		2026-03-04	1	2026-03-04 11:04:27.579312	2026-03-04 11:04:27.579312
2	1	EXPENSE	500000.00	Materials	Books and printing	Bookstore		2026-03-04	1	2026-03-04 11:04:27.73139	2026-03-04 11:04:27.73139
\.


--
-- TOC entry 3545 (class 0 OID 24577)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, full_name, role, created_at) FROM stdin;
1	teacher@example.com	cGFzc3dvcmQxMjM=	Admin Teacher	TEACHER	2026-03-04 11:04:27.350283
2	admin@khaiminh.local	S2hhaW1pbmhAMjAyNg==	Administrator	ADMIN	2026-03-04 11:13:04.335115
\.


--
-- TOC entry 3569 (class 0 OID 0)
-- Dependencies: 229
-- Name: attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.attendances_id_seq', 1, false);


--
-- TOC entry 3570 (class 0 OID 0)
-- Dependencies: 223
-- Name: class_monitors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.class_monitors_id_seq', 1, false);


--
-- TOC entry 3571 (class 0 OID 0)
-- Dependencies: 221
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.classes_id_seq', 1, true);


--
-- TOC entry 3572 (class 0 OID 0)
-- Dependencies: 225
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.students_id_seq', 2, true);


--
-- TOC entry 3573 (class 0 OID 0)
-- Dependencies: 227
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.transactions_id_seq', 2, true);


--
-- TOC entry 3574 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- TOC entry 3398 (class 2606 OID 24636)
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- TOC entry 3392 (class 2606 OID 24605)
-- Name: class_monitors class_monitors_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.class_monitors
    ADD CONSTRAINT class_monitors_pkey PRIMARY KEY (id);


--
-- TOC entry 3390 (class 2606 OID 24598)
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- TOC entry 3394 (class 2606 OID 24615)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 3396 (class 2606 OID 24626)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3386 (class 2606 OID 24588)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3388 (class 2606 OID 24586)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 2199 (class 826 OID 16775)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2198 (class 826 OID 16774)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2026-03-04 18:26:33

--
-- PostgreSQL database dump complete
--

\unrestrict losVHfVZgXFEwa8tOnlVg4IuZHusTx2kY6FtdQ51apIiR0Qd9rDTf4PGtrGniLk

