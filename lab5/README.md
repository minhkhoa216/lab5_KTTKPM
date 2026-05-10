# E-commerce Microservices System

Hệ thống quản lý đơn hàng sử dụng kiến trúc Microservices. Mỗi service giả định có cơ sở dữ liệu riêng (Database per Service) dựa trên **MongoDB** và giao tiếp bất đồng bộ qua **RabbitMQ**. Toàn bộ request từ bên ngoài đi qua **API Gateway**.

## 1. Thành phần
- **API Gateway (Port 8080)**: Chuyển tiếp request đến các service.
- **Product Service (Port 3001)**: Quản lý sản phẩm. Khi nhận thông điệp có hóa đơn mới từ RabbitMQ, nó tự động giảm `inventory`.
- **Order Service (Port 3002)**: Quản lý đơn hàng. Sau khi tạo sẽ emit một message `order_created` ra RabbitMQ.
- **Customer Service (Port 3003)**: Quản lý khách hàng.
- **MongoDB (Ports 27017, 27018, 27019)**: 3 Database độc lập cho 3 service.
- **RabbitMQ (Port 5672 & 15672)**: Message broker.

## 2. Cách khởi chạy hệ thống
Yêu cầu đã cài đặt **Docker** và **Docker Compose**.

1. Mở Terminal (Powershell/Cmd) trong thư mục dự án (`d:\KienTruc\lab5`).
2. Chạy câu lệnh:
   ```bash
   docker compose up -d --build
   ```
3. Chờ khoảng 1-2 phút để Docker tải image và khởi động (vì các package NPM sẽ được install). Bạn có thể kiểm tra trạng thái bằng lệnh:
   ```bash
   docker compose logs -f
   ```

## 3. Kịch bản Test bằng cURL hoặc API Client
Bạn gọi API thông qua **API Gateway** tại `http://localhost:8080`.

**Bước 1: Tạo Customer mới**
```bash
curl -X POST http://localhost:8080/customers -H "Content-Type: application/json" -d '{"name":"Nguyen Van A", "email":"a@example.com"}'
```

**Bước 2: Tạo Product mới (kèm Inventory lớn hơn 0)**
```bash
curl -X POST http://localhost:8080/products -H "Content-Type: application/json" -d '{"name":"Laptop Dell", "price":1500, "inventory":10}'
```
*(Ghi chú lại `_id` của Customer và Product vừa trả về).*

**Bước 3: Tạo Order mới (và kiểm tra RabbitMQ)**
Thay `[CUSTOMER_ID]` và `[PRODUCT_ID]` bằng id tương ứng ở trên:
```bash
curl -X POST http://localhost:8080/orders -H "Content-Type: application/json" -d '{
  "customerId": "[CUSTOMER_ID]",
  "items": [
    {
      "productId": "[PRODUCT_ID]",
      "quantity": 2,
      "price": 1500
    }
  ]
}'
```

**Bước 4: Kiểm tra việc tự động trừ tồn kho (Inventory)**
Sau khi tạo Order thành công, bạn quay lại gọi API lấy thông tin Product:
```bash
curl -X GET http://localhost:8080/products/[PRODUCT_ID]
```
Bạn sẽ thấy `inventory` của máy tính từ 10 xuống còn 8! Đó là kết quả của việc RabbitMQ gửi message giữa microservices.
