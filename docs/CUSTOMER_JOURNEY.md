# Customer Journey

Happy path for first paying customer.

```
Ad / referral
    ↓
Landing (value: AI after every call)
    ↓
Registration (company + admin user)
    ↓
Phone verification (optional MVP)
    ↓
Invite team members
    ↓
First login
    ↓
Create contact / company
    ↓
Receive or make call
    ↓
AI records + transcribes
    ↓
AI summary + suggested tasks
    ↓
Deal updated in CRM
    ↓
Payment (subscription)
    ↓
Renewal (retention)
```

## Engineering mapping

| Journey step | Platform / module | Status |
|--------------|-------------------|--------|
| Registration | Tenant + Organization + User | Tenant ✅ Org ✅ User 🔄 |
| Invite team | Membership + Auth invite | — |
| Login | Auth JWT | — |
| Create contact | CRM Contact | — |
| Call | Communication / Telephony | — |
| AI summary | AI service | — |
| Payment | Billing (later) | — |

See [NEXT.md](./NEXT.md) for current engineering focus.
