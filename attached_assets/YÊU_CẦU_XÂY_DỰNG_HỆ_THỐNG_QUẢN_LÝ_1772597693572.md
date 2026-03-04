# YÊU CẦU XÂY DỰNG HỆ THỐNG QUẢN LÝ LỚP HỌC (PRODUCTION-READY)

Tôi muốn bạn xây dựng một hệ thống web quản lý lớp học đa người dùng (multi-user) bao gồm:

- Quản lý tài chính thu/chi
- Quản lý lớp học
- Quản lý học viên
- Điểm danh
- Phân quyền giáo viên / lớp trưởng
- Hỗ trợ nhiều lớp trong cùng hệ thống

---

# I. YÊU CẦU KỸ THUẬT

- Frontend: Next.js (App Router)
- Backend: Next.js API Routes hoặc Node.js + Express
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT + bcrypt
- UI: TailwindCSS
- Biểu đồ: Chart.js hoặc Recharts
- Có thể chạy local bằng `npm run dev`
- Code theo cấu trúc production-ready
- Có seed dữ liệu mẫu

---

# II. HỆ THỐNG NGƯỜI DÙNG (AUTH + ROLE)

## 1. Đăng ký / Đăng nhập
- Email
- Password (hash bằng bcrypt)
- Họ tên

## 2. Phân quyền

Role gồm:
- TEACHER
- CLASS_MONITOR
- ADMIN (tuỳ chọn)

### Quy tắc:

- Teacher tạo lớp
- Teacher có toàn quyền lớp mình tạo
- Class Monitor chỉ được thao tác trong lớp được phân công
- Không truy cập được lớp khác

---

# III. QUẢN LÝ LỚP HỌC (MULTI-CLASS)

## Model: Class

- id
- name
- description
- teacherId
- createdAt

## Chức năng:

- Tạo lớp
- Sửa / xóa lớp
- Thêm lớp trưởng vào lớp
- Xem danh sách lớp mình phụ trách
- Mỗi lớp có dashboard riêng

---

# IV. QUẢN LÝ HỌC VIÊN

## Model: Student

- id
- fullName
- dateOfBirth
- phone
- parentPhone
- note
- classId
- createdAt

## Chức năng:

- Thêm học viên
- Sửa / xóa
- Tìm kiếm theo tên
- Import CSV
- Hiển thị tổng số học viên

---

# V. QUẢN LÝ TÀI CHÍNH (THU / CHI)

## Model: Transaction

- id (uuid)
- classId
- type (INCOME | EXPENSE)
- amount (decimal)
- category
- description
- person
- note
- date
- createdBy
- createdAt
- updatedAt

## Chức năng:

1. Thêm khoản thu
2. Thêm khoản chi
3. Sửa / xóa
4. Lọc theo:
   - Tháng
   - Quý
   - Năm
5. Tổng hợp:
   - Tổng thu
   - Tổng chi
   - Số dư
6. Xuất CSV
7. Biểu đồ:
   - Thu vs Chi theo tháng
   - Tỷ lệ theo category

## Validate:

- amount > 0
- Không cho sửa nếu không thuộc lớp của user

---

# VI. ĐIỂM DANH

## Model: Attendance

- id
- classId
- studentId
- date
- status (PRESENT | ABSENT | LATE)
- note
- createdBy

## Chức năng:

- Tạo buổi điểm danh theo ngày
- Điểm danh nhanh dạng bảng
- Thống kê:
  - Tỷ lệ chuyên cần từng học viên
  - Tổng số buổi vắng
  - Báo cáo tháng

---

# VII. DASHBOARD LỚP

Trang dashboard mỗi lớp hiển thị:

1. Tổng số học viên
2. Tổng thu tháng này
3. Tổng chi tháng này
4. Số dư hiện tại
5. Biểu đồ tài chính
6. Tỷ lệ chuyên cần trung bình

---

# VIII. PHÂN QUYỀN CHI TIẾT

## Teacher:

- Toàn quyền lớp mình tạo
- Thêm/xóa lớp trưởng
- Xem toàn bộ báo cáo

## Class Monitor:

- Thêm/sửa giao dịch
- Điểm danh
- Thêm học viên
- Không xóa lớp
- Không quản lý role

---

# IX. CẤU TRÚC DATABASE PRISMA

Tạo đầy đủ `schema.prisma` với quan hệ:

- User
- Class
- Student
- Transaction
- Attendance

## Quan hệ:

- User 1-n Class
- Class 1-n Student
- Class 1-n Transaction
- Class 1-n Attendance
- Student 1-n Attendance

---

# X. SEED DATA

Tạo seed gồm:

- 1 teacher
- 1 class monitor
- 2 lớp
- 20 học viên mỗi lớp
- 10 giao dịch mẫu
- 5 buổi điểm danh

---

# XI. CẤU TRÚC CODE

Tách layer rõ ràng:

- routes
- controllers
- services
- middleware

## Middleware:

- auth
- role guard
- class ownership guard

Yêu cầu:

- Clean code
- Có hướng dẫn cài đặt
- Có hướng dẫn deploy

---

# XII. TÍNH NĂNG NÂNG CAO (OPTIONAL)

- Dark mode
- Thông báo khi số dư âm
- Export báo cáo PDF
- Log audit hoạt động người dùng

---

# YÊU CẦU THỰC HIỆN

Hãy:

1. Tạo toàn bộ cấu trúc project
2. Viết đầy đủ backend
3. Viết frontend kết nối API
4. Viết schema Prisma
5. Viết seed script
6. Viết hướng dẫn chạy chi tiết

Nếu cần, bạn có thể đề xuất thêm cải tiến để hệ thống có thể mở rộng cho nhiều trung tâm đào tạo trong tương lai.