# Documentation - Project Overview & Specifications

This directory contains the complete project documentation for the **Online Voucher Discount E-Commerce Platform**. All documents follow the academic coursework requirements for the E-Commerce course.

## Table of Contents

1. [Project Summary](#project-summary)
2. [Documentation Files](#documentation-files)
3. [Project Timeline](#project-timeline)
4. [Architecture Overview](#architecture-overview)
5. [Key Stakeholders](#key-stakeholders)
6. [Document Guidelines](#document-guidelines)

---

## Project Summary

### Project Name

**Online Voucher Discount E-Commerce Platform** (Hệ thống thương mại điện tử bán voucher giảm giá trực tuyến)

### Course

E-Commerce (Thương mại Điện tử) — Semester 3, Academic Year 2025–2026

### Project Objective

Develop a comprehensive online marketplace platform that enables:

- **Partners** (merchants/vendors) to create and manage discount vouchers
- **Customers** to discover, purchase, and redeem vouchers
- **Admin** to review, approve, and monitor all transactions

### Problem Statement

Traditional voucher management systems are fragmented:

- Manual voucher issuance processes
- Difficulty tracking redemption status
- Lack of centralized verification mechanism
- Limited reporting and analytics
- Security concerns with voucher code generation

### Solution

A centralized e-commerce platform providing:

- Standardized voucher lifecycle management
- Unique, verifiable voucher code generation
- Real-time inventory tracking
- Comprehensive transaction logging
- Detailed sales and usage analytics

---

## Documentation Files

### 📄 [01_tom-tat-do-an.md](01_tom-tat-do-an.md)

**Project Summary (Tóm Tắt Đồ Án)**

**Purpose:** Executive overview and project context

- **Context & Problem Statement** - Background on voucher e-commerce market
- **Proposed Solution** - Platform overview and value proposition
- **General Business Workflow** - End-to-end voucher lifecycle

**Contents:**

- Bối cảnh thị trường voucher tại Việt Nam
- Các vấn đề của hệ thống hiện tại
- Giải pháp được đề xuất
- Luồng nghiệp vụ tổng quát từ đăng ký đến sử dụng

**Audience:** Project stakeholders, team leads, course instructors
**Document Status:** ✅ Complete

---

### 📄 [02_ke-hoach-tong-quat.md](02_ke-hoach-tong-quat.md)

**Overall Project Plan (Kế Hoạch Tổng Quát)**

**Purpose:** Project planning, timeline, and team organization

- **Project Phases** - 5-stage project lifecycle
- **Team Roles & Responsibilities** - Role assignments and expectations
- **Timeline & Milestones** - Schedule and key deliverables
- **Tools & Technologies** - Technology stack recommendations
- **Risk Management** - Potential risks and mitigation strategies
- **Completion Criteria** - Definition of success

**Contents:**

- Chia 5 giai đoạn (Phân tích, Thiết kế, Cài đặt, Kiểm thử, Bàn giao)
- Lịch trình chi tiết (tuần 1–10)
- Công cụ & công nghệ được sử dụng
- Phân công vai trò nhóm
- Rủi ro & biện pháp phòng ngừa
- Tiêu chí hoàn thành dự án

**Audience:** Project manager, team members, instructors
**Document Status:** ✅ Complete

---

### 📄 [03_ke-hoach-chi-tiet-giai-doan.md](03_ke-hoach-chi-tiet-giai-doan.md)

**Detailed Phase Plan (Kế Hoạch Chi Tiết Giai Đoạn)**

**Purpose:** Granular task breakdown for each project phase

- **Phase 1: Analysis & Specification** - Requirement gathering and documentation
- **Phase 2: System Design** - Database and UI design
- **Phase 3: Implementation** - Development and deployment
- **Phase 4: Testing** - Quality assurance processes
- **Phase 5: Delivery & Presentation** - Documentation and final handover

**Contents:**

- Chi tiết từng giai đoạn với đầu vào, đầu ra, công việc cụ thể
- Tiêu chí hoàn thành từng giai đoạn
- Người chịu trách nhiệm cho từng công việc
- Tài liệu cần tạo ra
- Tiêu chí review và approval

**Audience:** Team members executing the project, QA team
**Document Status:** ✅ Complete

---

### 📄 [04_tai-lieu-hop-dau-tien.md](04_tai-lieu-hop-dau-tien.md)

**Initial Specifications Document (Tài Liệu Hợp Đầu Tiên)**

**Purpose:** Detailed requirements and system design specifications

- **System Requirements** - Functional and non-functional requirements
- **Use Cases & Actor Specifications** - User stories and interactions
- **Data Models** - Entity relationship diagram concepts
- **UI/UX Specifications** - Wireframe descriptions and user flows
- **Technical Architecture** - System design and technology choices
- **Security & Compliance** - Data protection and access control requirements

**Contents:**

- Yêu cầu chi tiết của hệ thống
- Use case diagrams và mô tả chi tiết
- Entity Relationship Diagram (ERD)
- Wireframe của các trang chính
- Luồng dữ liệu (Data Flow Diagram)
- Yêu cầu về bảo mật & xác thực

**Audience:** Architects, developers, testers, stakeholders
**Document Status:** ✅ Complete

---

### 📄 [05_huong-dan-initialize.md](05_huong-dan-initialize.md)

**Initialization & Setup Guide (Hướng Dẫn Initialize)**

**Purpose:** Step-by-step instructions for project setup and initialization

- **Environment Setup** - Development environment configuration
- **Technology Installation** - Required software installation
- **Project Structure** - Directory organization and file setup
- **Database Initialization** - Schema creation and seed data
- **First Run Instructions** - Steps to get the system running for the first time

**Contents:**

- Cách setup môi trường phát triển
- Cài đặt Node.js, npm, database
- Cấu hình biến môi trường
- Khởi tạo cơ sở dữ liệu
- Chạy ứng dụng lần đầu
- Kiểm tra hoạt động ban đầu

**Audience:** Developers, new team members, deployment engineers
**Document Status:** ✅ Complete

---

## Project Timeline

### Development Phases

```
┌─────────────────────────────────────────────────────────────────┐
│ Week 1–2  │ Phase 1: Analysis & Specification (Phân tích & Đặc tả)
├─────────────────────────────────────────────────────────────────┤
│ Week 3    │ Phase 2a: Database Design (Thiết kế CSDL)
├─────────────────────────────────────────────────────────────────┤
│ Week 4    │ Phase 2b: UI/UX Design (Thiết kế giao diện)
├─────────────────────────────────────────────────────────────────┤
│ Week 5–8  │ Phase 3: Implementation (Cài đặt & Phát triển)
├─────────────────────────────────────────────────────────────────┤
│ Week 9    │ Phase 4: Testing (Kiểm thử)
├─────────────────────────────────────────────────────────────────┤
│ Week 10   │ Phase 5: Delivery & Presentation (Bàn giao & Thuyết trình)
└─────────────────────────────────────────────────────────────────┘
```

### Key Milestones

| Milestone | Description                            | Target Week |
| --------- | -------------------------------------- | ----------- |
| **M1**    | Analysis & Specification complete      | Week 2      |
| **M2**    | Database & UI design approved          | Week 4      |
| **M3**    | Alpha demo (basic workflow functional) | Week 6      |
| **M4**    | Beta demo (all features implemented)   | Week 8      |
| **M5**    | Final delivery & presentation          | Week 10     |

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │  Customer UI │  Partner UI  │   Admin UI   │            │
│  └──────────────┴──────────────┴──────────────┘            │
└──────────────────────────┬──────────────────────────────────┘
                          │
                HTTP/REST │
                          │
┌──────────────────────────▼──────────────────────────────────┐
│              Backend API (Express.js + Node.js)             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Routes → Controllers → Services → Repositories → DB  │  │
│  └───────────────────────────────────────────────────────┘  │
│  Authentication │ Authorization │ Business Logic │ Logging  │
└──────────────────────────┬──────────────────────────────────┘
                          │
                Database  │
                          │
┌──────────────────────────▼──────────────────────────────────┐
│          Database (MySQL/PostgreSQL)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Users │ Partners │ Vouchers │ Orders │ Transactions │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Three-Tier Architecture

#### 1. **Presentation Tier (Frontend)**

- React-based user interfaces
- Responsive design for web browsers
- Role-based UI (Customer, Partner, Admin)
- Real-time updates and notifications

#### 2. **Application Tier (Backend)**

- Express.js REST API server
- Business logic processing
- Authentication & Authorization
- Data validation and transformation
- Workflow orchestration

#### 3. **Data Tier (Database)**

- Relational database (MySQL/PostgreSQL)
- Normalized schema design
- Data persistence and integrity
- Backup and recovery

---

## Key Stakeholders

### Internal Stakeholders

- **Project Manager** - Overall coordination and timeline management
- **Business Analyst** - Requirements gathering and documentation
- **Frontend Developers** - UI implementation
- **Backend Developers** - API and business logic
- **Database Designer** - Schema design and optimization
- **QA Team** - Testing and quality assurance

### External Stakeholders

- **Course Instructor** - Academic oversight and grading
- **Partners/Merchants** - Voucher sellers
- **Customers** - Voucher buyers
- **Platform Admin** - System oversight

---

## Document Guidelines

### How to Use This Documentation

1. **New Team Members:** Start with [01_tom-tat-do-an.md](01_tom-tat-do-an.md) to understand the project context

2. **Project Planning:** Review [02_ke-hoach-tong-quat.md](02_ke-hoach-tong-quat.md) for timeline and roles

3. **Detailed Tasks:** Reference [03_ke-hoach-chi-tiet-giai-doan.md](03_ke-hoach-chi-tiet-giai-doan.md) for specific work items

4. **System Specification:** Consult [04_tai-lieu-hop-dau-tien.md](04_tai-lieu-hop-dau-tien.md) for technical requirements

5. **Environment Setup:** Follow [05_huong-dan-initialize.md](05_huong-dan-initialize.md) to set up your development environment

### Document Maintenance

- Update documents when requirements change
- Keep timelines synchronized with actual progress
- Document decisions and their rationale
- Maintain a change log for each document
- Review documents weekly during team meetings

### Document Conventions

- Vietnamese document titles with English descriptive text
- Numbered sections for easy referencing
- Code examples in markdown code blocks
- Diagrams using ASCII art or markdown (can be replaced with Lucidchart/draw.io)
- Links to related documents

---

## Key Business Concepts

### User Roles

1. **Customer** - Purchases and redeems vouchers
2. **Partner/Merchant** - Creates and manages vouchers for their business
3. **Admin** - Approves partners and vouchers, manages platform

### Voucher Lifecycle

```
Create → Review → Approve → Publish → Purchase → Generate Codes
→ Distribute → Redeem → Verify → Complete → Report
```

### Critical Business Rules

- Each voucher has a limited quantity and expiration date
- Voucher codes are unique and cannot be reused
- Partners must be approved before creating vouchers
- Vouchers must be reviewed by admin before publishing
- Payment is required before code distribution
- Codes can only be redeemed once per customer

---

## Supporting Resources

### Related Documentation in Repository

- **Backend README:** `backend/README.md` - API architecture and setup
- **Frontend README:** `frontend/README.md` - UI architecture and setup
- **Root README:** `../README.md` - Overall project overview

### External Resources

- E-Commerce concepts: [https://en.wikipedia.org/wiki/E-commerce](https://en.wikipedia.org/wiki/E-commerce)
- Voucher systems: Marketing and discount management
- Database design patterns
- REST API best practices
- React and Express.js documentation

### Tools Recommended

- **Project Management:** Trello, Notion, GitHub Projects
- **Diagramming:** draw.io, Lucidchart, Figma
- **API Testing:** Postman, Insomnia, REST Client (VS Code)
- **Database Tools:** MySQL Workbench, pgAdmin, DBeaver
- **Version Control:** Git, GitHub, GitLab

---

## FAQ

### Q: Where should I start if I just joined the team?

**A:** Read `01_tom-tat-do-an.md` first, then `02_ke-hoach-tong-quat.md`, then the README files in frontend/ and backend/

### Q: What are the key deliverables?

**A:** Working platform with all 3 user roles, comprehensive documentation, and successful presentation

### Q: How do I report a requirement change?

**A:** Update the appropriate document, notify the project manager, and update the timeline if necessary

### Q: What if I find a discrepancy in the documentation?

**A:** Inform the project lead immediately and suggest corrections

### Q: Are there any hidden dependencies between phases?

**A:** Yes - Phase 2 depends on Phase 1 completion; Phase 3 can start after database schema is finalized; Phase 4 depends on Phase 3 deliverables

---

## Document Version History

| Version | Date       | Author       | Changes                         |
| ------- | ---------- | ------------ | ------------------------------- |
| 1.0     | 2026-03-15 | Project Team | Initial documentation structure |
| 1.1     | 2026-03-20 | Project Team | Added detailed phase breakdown  |
| 1.2     | 2026-04-01 | Project Team | Added technical specifications  |

---

**Last Updated:** 2026-06-07  
**Document Owner:** Project Manager  
**Next Review Date:** End of Week 10

For questions or clarifications, contact the project manager or team lead.
