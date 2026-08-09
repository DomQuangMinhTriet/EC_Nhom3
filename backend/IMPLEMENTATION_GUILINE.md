# Backend Implementation Guideline

## 1. Structure module

Tạo module mới theo pattern:

```txt
src/modules/<module>/
  <module>.routes.ts
  <module>.controller.ts
  <module>.service.ts
  <module>.repository.ts
```

Đăng ký route tại `src/routes/index.ts`:

```ts
apiRouter.use("/api/<module>", <module>Router);
```

## 2. Style class

- Dùng `class` cho `Controller`, `Service`, `Repository`.
- Inject dependency qua constructor, có default instance như auth:

```ts
export class ExampleService {
  constructor(private readonly exampleRepository = new ExampleRepository()) {}
}
```

- `Controller`: đọc request, validate cơ bản, gọi service, trả response.
- `Service`: xử lý business logic, gọi repository/lib, throw `AppError`.
- `Repository`: chỉ thao tác DB bằng Drizzle, không chứa business logic.

## 3. Style request

Định nghĩa type input gần nơi dùng, ưu tiên `type`:

```ts
type CreateExampleInput = {
  name: string;
  status?: ExampleStatus;
};
```

Trong controller, cast `req.body` rõ field:

```ts
const { name } = req.body as { name?: string };
```

## 4. Style response

- Response trả object JSON rõ nghĩa.
- Có thể tách helper response trong service nếu dùng lại:

```ts
const exampleResponse = (record: ExampleRecord) => ({
  example: record,
});
```

- Tạo mới: `res.status(201).json(result)`.
- Thành công bình thường: `res.json(result)`.

## 5. Validate giá trị

- Validate field bắt buộc ở controller.
- Validate business rule ở service.
- Khi lỗi, throw `AppError(message, statusCode)`.

```ts
if (!name) {
  throw new AppError("name is required", 400);
}
```

Với enum/string union, tạo list `as const` và type guard:

```ts
const statuses = ["pending", "active"] as const;
type ExampleStatus = (typeof statuses)[number];

const isExampleStatus = (value: string): value is ExampleStatus =>
  statuses.includes(value as ExampleStatus);
```

## 6. Enum/constant

- DB enum lưu tại `src/db/schema/enums.ts` bằng `pgEnum`.
- Constant chỉ dùng trong 1 module thì đặt trong file module đó.
- Constant dùng chung nhiều module thì đưa vào `src/shared` hoặc file schema/type phù hợp.
- Không hardcode enum rải rác nhiều nơi.

## 7. Routes

- Mọi async handler phải bọc bằng `asyncHandler`.
- Khởi tạo controller 1 lần trong routes file.

```ts
const exampleController = new ExampleController();

exampleRouter.post("/", asyncHandler(exampleController.create));
```

## 8. Lưu ý

- Không bắt lỗi bằng `try/catch` nếu chỉ để `next(error)`, để `asyncHandler` xử lý.
- Không trả password, token bí mật, hoặc internal error raw ra response.
- DB timestamp nên có `createdAt`, `updatedAt`; khi update nhớ set `updatedAt: new Date()`.
- Tên file dùng kebab/lowercase theo module hiện tại: `auth.service.ts`, `auth.routes.ts`.
- Giữ controller mỏng, service rõ nghiệp vụ, repository gọn DB query.

test test test
test test test
