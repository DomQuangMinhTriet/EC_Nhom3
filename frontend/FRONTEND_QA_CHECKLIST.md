# Frontend QA Checklist

## Automated coverage

- [x] Voucher browse/filter and legacy slug resolution.
- [x] Customer cart add/update/clear flow.
- [x] Authentication form validation.
- [x] Partner voucher payload validation.
- [x] Branch redeem code validation.
- [x] Admin rejection requires a reason.

Run with `npm run test`.

## Manual accessibility and responsive review

- [x] Keyboard-focus outline is globally visible.
- [x] Inputs have visible labels and invalid-form feedback.
- [x] Responsive voucher-detail path tested at 360px with no horizontal scroll.
- [x] Loading, error and 404 fallbacks are present at app level.
- [ ] Before release, test every mutation with keyboard only and a real screen reader.
- [ ] Before release, validate contrast with final production assets and copy.

## Local commands

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```
