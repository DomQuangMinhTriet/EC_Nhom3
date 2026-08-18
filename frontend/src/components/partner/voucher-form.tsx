"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { State } from "@/components/common/state";
import { VoucherStatusBadge } from "@/components/voucher/voucher-status-badge";
import { useToast } from "@/components/common/toast";
import { partnerVoucherSchema, type PartnerVoucherValues } from "@/lib/schemas/workflows";
import { useCategories, useCreatePartnerVoucher, useUpdatePartnerVoucher, useVoucherProduct } from "@/hooks/queries/use-voucher-products";

export function VoucherForm({ voucherId }: { voucherId?: string }) {
  const editing = Boolean(voucherId);
  const toast = useToast();
  const router = useRouter();
  const categoriesQuery = useCategories();
  const voucherQuery = useVoucherProduct(voucherId ?? "");
  const createVoucher = useCreatePartnerVoucher();
  const updateVoucher = useUpdatePartnerVoucher();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PartnerVoucherValues>({
    resolver: zodResolver(partnerVoucherSchema),
    defaultValues: { minLimit: 1 },
  });

  useEffect(() => {
    const voucher = voucherQuery.data;
    if (!voucher) return;

    reset({
      categoryId: voucher.categoryId,
      title: voucher.title,
      description: voucher.description,
      originalPrice: Number(voucher.originalPrice),
      discountType: voucher.discountType,
      discountValue: Number(voucher.discountValue),
      startDate: voucher.startDate.slice(0, 10),
      endDate: voucher.endDate.slice(0, 10),
      validDurationDays: voucher.validDurationDays,
      minLimit: voucher.minLimit,
      maxLimit: voucher.maxLimit ?? undefined,
      imageUrl: voucher.imageUrl ?? "",
    });
  }, [voucherQuery.data, reset]);

  async function submit(values: PartnerVoucherValues) {
    const body = {
      categoryId: values.categoryId,
      title: values.title,
      description: values.description || undefined,
      originalPrice: values.originalPrice,
      discountType: values.discountType,
      discountValue: values.discountValue,
      startDate: values.startDate,
      endDate: values.endDate,
      validDurationDays: values.validDurationDays,
      minLimit: values.minLimit,
      maxLimit: values.maxLimit,
      imageUrl: values.imageUrl || undefined,
    };

    try {
      if (editing && voucherId) {
        await updateVoucher.mutateAsync({ id: voucherId, input: body });
        toast("Đã lưu thay đổi voucher.");
      } else {
        await createVoucher.mutateAsync(body);
        toast("Voucher đã gửi chờ duyệt.");
      }
      router.push("/partner/vouchers");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu voucher.", "error");
    }
  }

  if (editing && voucherQuery.isLoading) {
    return <State icon="⏳" title="Đang tải voucher" text="Vui lòng chờ trong giây lát."/>;
  }

  if (editing && voucherQuery.isError) {
    return <State icon="⚠️" title="Không thể tải voucher" text={voucherQuery.error instanceof Error ? voucherQuery.error.message : "Đã xảy ra lỗi."}/>;
  }

  const voucher = voucherQuery.data;

  return (
    <form onSubmit={handleSubmit(submit)} className="rounded-xl border border-slate-200 bg-white p-6 shadow-brand-sm">
      {voucher && (
        <div className="mb-6 flex items-center justify-between rounded-lg bg-slate-50 p-4">
          <div>
            <b className="block text-sm text-slate-800">Trạng thái voucher</b>
            {voucher.status === "rejected" && voucher.rejectionReason && <p className="mt-1 text-xs text-danger">Lý do: {voucher.rejectionReason}</p>}
          </div>
          <VoucherStatusBadge status={voucher.status}/>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Tên voucher" required className="md:col-span-2" error={errors.title?.message} {...register("title")}/>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
          Danh mục
          <select className="rounded-lg border-[1.5px] border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-primary" {...register("categoryId")}>
            <option value="">Chọn danh mục</option>
            {categoriesQuery.data?.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.name}</option>)}
          </select>
          {errors.categoryId && <span className="text-danger">{errors.categoryId.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
          Loại giảm giá
          <select className="rounded-lg border-[1.5px] border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-primary" {...register("discountType")}>
            <option value="percentage">Phần trăm (%)</option>
            <option value="direct">Số tiền cố định</option>
          </select>
          {errors.discountType && <span className="text-danger">{errors.discountType.message}</span>}
        </label>

        <Input label="Giá gốc" type="number" required error={errors.originalPrice?.message} {...register("originalPrice")}/>
        <Input label="Giá trị giảm" type="number" required error={errors.discountValue?.message} {...register("discountValue")}/>
        <Input label="Ngày bắt đầu" type="date" required error={errors.startDate?.message} {...register("startDate")}/>
        <Input label="Ngày kết thúc" type="date" required error={errors.endDate?.message} {...register("endDate")}/>
        <Input label="Số ngày hiệu lực (sau khi mua)" type="number" required error={errors.validDurationDays?.message} {...register("validDurationDays")}/>
        <Input label="Số lượng tối thiểu" type="number" error={errors.minLimit?.message} {...register("minLimit")}/>
        <Input label="Số lượng tối đa" type="number" error={errors.maxLimit?.message} {...register("maxLimit")}/>
        <Input label="URL ảnh voucher" className="md:col-span-2" error={errors.imageUrl?.message} {...register("imageUrl")}/>
      </div>

      <label className="mt-5 flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
        Mô tả & điều kiện
        <textarea className="min-h-28 rounded-lg border-[1.5px] border-slate-200 p-3 text-sm font-normal outline-none focus:border-primary" placeholder="Mô tả ưu đãi, điều kiện và chi nhánh áp dụng..." {...register("description")}/>
      </label>

      <Button type="submit" className="mt-6" size="lg" disabled={isSubmitting || createVoucher.isPending || updateVoucher.isPending}>
        {editing ? "Lưu thay đổi" : "Gửi duyệt voucher"}
      </Button>
    </form>
  );
}
