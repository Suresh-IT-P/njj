# City Ride Taxi Complete Process, Data & Route Documentation

## 1. Executive Architecture & Flow

City Ride Taxi is an enterprise-grade ride-hailing and fleet management platform powered by an Express Node.js backend (`server.js`), MySQL relational database (`railway`), Socket.IO real-time web-socket engine, and Server-Sent Events (SSE) telemetry.

```
+-----------------------------------------------------------------------------------+
|                            Client Requests (REST / Socket.IO)                      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        Express Middleware Security Pipeline                        |
|  - Rate Limiter (RateLimit Headers / IP Throttling)                               |
|  - JWT Authentication (Cookies: cr_usr_tok, cr_drv_tok, cr_vnd_tok, cr_adm_tok)  |
|  - Dynamic Role Verification & Association Scope Isolation                        |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             Core Engine Architecture                              |
|  - Pricing Engine (pricingEngine.js: Slab Tariff, Peak Surge, Special Location)   |
|  - Haversine Distance & Air Boundary Calculator                                   |
|  - Commission & Ledger Engine (commissionEngine.js: Wallet Debits & Settlement)   |
|  - Real-Time Dispatch & WebRTC Signaling (Socket.IO & Event Emitters)             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             Database & Telemetry Layer                            |
|  - MySQL Database (`railway` Schema, 27 Exhaustive Data Tables)                  |
|  - Real-Time SSE Event Stream (`/api/monitor/stream`)                             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Frontend HTML Route Registry

| Route | File Served | Access Level | Description |
|---|---|---|---|
| `GET /` | `public/index.html` | Public | Customer landing, ride estimation, and single-page booking application |
| `GET /auth` | Redirect to `/` | Public | Legacy authentication link handler (redirects to home modal) |
| `GET /driver` | `public/driver.html` | Driver | Operational web portal for drivers (duty status, live ride console, wallet balance) |
| `GET /driver-login` | `public/driver-login.html` | Public | Driver authentication portal |
| `GET /driver-register` | `public/driver-register.html` | Public | Driver onboarding with document upload (DL, RC, PVC, Aadhar, QR) |
| `GET /vendor` | `public/vendor.html` | Vendor | Fleet owner administrative console (fleet tracking, earnings, custom tariffs) |
| `GET /vendor-login` | `public/vendor-login.html` | Public | Fleet partner portal authentication |
| `GET /admin` | `public/admin.html` | Super Admin | Super admin master management dashboard |
| `GET /admin-login` | `public/admin-login.html` | Public | Super admin secure login panel |
| `GET /dashboard` | `public/dashboard.html` | Passenger | Customer dashboard for booking history and account management |
| `GET /association-admin` | `public/association-admin.html` | Association Admin | District Union/Association driver fleet & tariff panel |
| `GET /dbmanager` | `public/dbmanager.html` | Super Admin | Visual database inspector and row editor |
| `GET /terms` | `public/terms.html` | Public | Terms of Service, Privacy Policy & Refund Guidelines |
| `GET /monitor` | `public/monitor.html` | Admin / Ops | Real-time system telemetry and request rate dashboard |

---

## 3. Exhaustive Database Schemas & Data Tables

The underlying MySQL database (`railway`) contains 27 structured tables. Below are the complete schemas, data fields, constraints, and default values.

### 1. `taxi_passengers` / `passengers`
Stores registered customer accounts.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `name`: VARCHAR(100)
- `email`: VARCHAR(100)
- `password`: VARCHAR(255) (Bcrypt hashed)
- `phone`: VARCHAR(20) UNIQUE
- `otp_verified`: TINYINT DEFAULT 0
- `banned_until`: TIMESTAMP NULL
- `is_blocked`: TINYINT DEFAULT 0
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 2. `taxi_drivers`
Main repository for active drivers.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `name`: VARCHAR(100)
- `email`: VARCHAR(100) UNIQUE
- `password`: VARCHAR(255)
- `phone`: VARCHAR(20) UNIQUE
- `car_model`: VARCHAR(50)
- `car_number`: VARCHAR(20)
- `vehicle_type`: VARCHAR(50) DEFAULT 'sedan' (bike, auto, hatchback, sedan, suv, 8plus1, van24)
- `wallet_balance`: DECIMAL(10,2) DEFAULT 0.00
- `is_blocked`: TINYINT DEFAULT 0
- `approval_status`: VARCHAR(20) DEFAULT 'approved'
- `is_online`: TINYINT DEFAULT 0
- `latitude`: DECIMAL(10, 8) NULL
- `longitude`: DECIMAL(11, 8) NULL
- `district`: VARCHAR(100) NULL
- `association_id`: INT NULL
- `association_name`: VARCHAR(150) DEFAULT 'City Ride Taxi Driver (Independent)'
- `association_id_card`: LONGTEXT NULL (Base64 / URL)
- `dl_front`, `dl_back`, `pvc`, `aadhar_front`, `aadhar_back`, `rc_book`, `insurance`, `pollution`, `permit`, `payment_qr`, `profile_photo`: LONGTEXT
- `dl_expiry`, `pvc_expiry`, `insurance_expiry`, `pollution_expiry`, `permit_expiry`: DATE NULL
- `pref_loc_1`, `pref_loc_2`, `pref_loc_3`: VARCHAR(100)
- `ride_local`: TINYINT DEFAULT 1
- `ride_oneway`: TINYINT DEFAULT 1
- `ride_round`: TINYINT DEFAULT 1
- `seating_capacity`: INT DEFAULT 5
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 3. `taxi_driver_applications`
Queue for pending driver onboarding registrations.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `name`, `email`, `password`, `phone`, `car_model`, `car_number`, `vehicle_type`: Data fields
- All Document fields: `dl_front`, `dl_back`, `pvc`, `aadhar_front`, `aadhar_back`, `rc_book`, `insurance`, `pollution`, `permit`, `payment_qr`, `profile_photo` (LONGTEXT)
- `status`: VARCHAR(20) DEFAULT 'pending' (`pending`, `approved`, `rejected`)
- `admin_note`: TEXT
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 4. `taxi_admins`
Super administrator accounts.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `name`: VARCHAR(100)
- `email`: VARCHAR(100) UNIQUE
- `password`: VARCHAR(255)
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- *Default Seed*: `admin@cityridetaxi` / `adminpass`

### 5. `taxi_vendors`
Fleet partner management accounts.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `vendor_id`: VARCHAR(50) UNIQUE
- `name`: VARCHAR(100)
- `business_name`: VARCHAR(100)
- `email`: VARCHAR(100) UNIQUE
- `password`: VARCHAR(255)
- `phone`: VARCHAR(20)
- `is_blocked`: TINYINT DEFAULT 0
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 6. `taxi_bookings`
Central ride transaction table tracking complete lifecycle.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `user_id`: INT
- `pickup_loc`: TEXT
- `pickup_coords`: VARCHAR(100) ("lng,lat")
- `drop_loc`: TEXT
- `drop_coords`: VARCHAR(100) ("lng,lat")
- `extra_drops`: TEXT (JSON Array of intermediate stops)
- `pickup_date`: DATE, `pickup_time`: TIME, `return_date`: DATE DEFAULT NULL
- `passengers`: INT, `seating_capacity`: INT DEFAULT 4
- `vehicle_type`: VARCHAR(50), `trip_type`: VARCHAR(50) (`local`, `oneway`, `round`, `rental`, `parcel`)
- `fare`: VARCHAR(20), `estimated_fare`: VARCHAR(50), `dynamic_fare`: VARCHAR(50), `original_fare`: VARCHAR(50)
- `distance`: VARCHAR(50), `estimated_distance`: VARCHAR(50), `actual_distance`: VARCHAR(50), `dynamic_distance`: VARCHAR(50)
- `estimated_duration`: VARCHAR(50)
- `air_distance_boost_km`: DECIMAL(10,2) DEFAULT 0
- `pickup_incentive_fare`: DECIMAL(10,2) DEFAULT 0
- `status`: ENUM('pending', 'assigned', 'vendor_assigned', 'pending_vendor_assignment', 'ongoing', 'finished', 'completed', 'cancelled', 'cancel_requested') DEFAULT 'pending'
- `cancel_reason`: TEXT
- `journey_otp`: VARCHAR(10), `end_otp`: VARCHAR(10)
- `driver_id`: INT NULL, `vendor_id`: INT NULL, `vendor_markup`: DECIMAL(10,2) DEFAULT 0, `driver_accept_required`: TINYINT DEFAULT 0
- `special_place_type`: VARCHAR(50) DEFAULT NULL
- `association_id`: INT DEFAULT NULL
- `start_odometer`: INT NULL, `end_odometer`: INT NULL
- `journey_start_time`: DATETIME NULL, `reached_pickup_time`: DATETIME NULL, `journey_end_time`: DATETIME NULL
- `rental_package`: VARCHAR(50) NULL ("2-20", "4-40", "8-80", "12-120")
- `start_gps_coords`: VARCHAR(100) NULL, `end_gps_coords`: VARCHAR(100) NULL
- `is_deviated`: TINYINT DEFAULT 0
- `rating`: TINYINT NULL, `rating_comment`: TEXT NULL
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 7. `taxi_tariffs`, `taxi_vendor_tariffs`, `taxi_association_tariffs`
Vehicle tariff configuration matrices (Global, Vendor, Association).
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `vehicle_type`: VARCHAR(50)
- `category` / `trip_type`: VARCHAR(50)
- `config`: JSON (`{ base, perKm, minKm, extraHour, extraKm, ... }`)
- `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### 8. `taxi_peak_rules`
Peak hour surcharge triggers.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `start_time`: TIME (Default: `08:00:00`, `16:00:00`)
- `end_time`: TIME (Default: `11:00:00`, `21:00:00`)
- `surcharge_percentage`: DECIMAL(5,2) (Default: `25.00` = +25%)
- `is_active`: TINYINT DEFAULT 1

### 9. `taxi_special_location_charges`
Surcharges for high-traffic or special point-of-interest destinations.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `place_type`: VARCHAR(100) UNIQUE (`mall`, `cinema`, `beach`, `resort`, `restaurant`, `railway_station`, `bus_stand`, `airport`)
- `display_name`: VARCHAR(150)
- `surcharge_percentage`: DECIMAL(5,2) (Default: `5.00`% to `15.00`%)
- `is_active`: TINYINT DEFAULT 1

### 10. `taxi_commission_configs`
Versioned platform commission settings.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `version`: INT NOT NULL
- `customer_commission_type`: VARCHAR(20) DEFAULT 'percentage' (`percentage` / `fixed`)
- `customer_commission_percent`: DECIMAL(5,2) DEFAULT 0
- `customer_commission_fixed`: DECIMAL(10,2) DEFAULT 0
- `driver_commission_type`: VARCHAR(20) DEFAULT 'percentage'
- `driver_commission_percent`: DECIMAL(5,2) DEFAULT 0
- `driver_commission_fixed`: DECIMAL(10,2) DEFAULT 0
- `total_commission_percent`: DECIMAL(5,2) DEFAULT 0
- `maintenance_percent`: DECIMAL(5,2) DEFAULT 0
- `association_percent`: DECIMAL(5,2) DEFAULT 0
- `cityride_percent`: DECIMAL(5,2) DEFAULT 0
- `status`: VARCHAR(20) DEFAULT 'active'
- *Default Seed (Version 1)*: Customer: `10%`, Driver: `5%`, Total: `15%`, Maintenance: `2%`, Association: `8%`, City Ride: `5%`

### 11. `taxi_associations`
District drivers union/association registry.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `name`: VARCHAR(100)
- `city_name`: VARCHAR(100)
- `admin_username`: VARCHAR(50) UNIQUE
- `admin_password`: VARCHAR(255)
- `commission_type`: ENUM('percentage', 'fixed') DEFAULT 'percentage'
- `commission_value`: DECIMAL(10, 2) DEFAULT 0
- `commission_customer_pct`: DECIMAL(10,2) DEFAULT 0
- `commission_customer_fixed`: DECIMAL(10,2) DEFAULT 0
- `commission_driver_pct`: DECIMAL(10,2) DEFAULT 0
- `commission_driver_fixed`: DECIMAL(10,2) DEFAULT 0
- `geofence_radius`: DECIMAL(10, 2) DEFAULT 50 (KM)
- `latitude`: DECIMAL(10,8), `longitude`: DECIMAL(11,8)
- `is_active`: TINYINT DEFAULT 1

### 12. `taxi_financial_ledger`
Immutable ledger recording every revenue transaction per ride.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `booking_id`: INT NOT NULL
- `transaction_type`: VARCHAR(50) NOT NULL (`ride_fare`, `driver_commission`, `customer_platform_fee`, `district_customer_fee`, `district_driver_fee`, `cityride_allocation`, `vendor_allocation`)
- `amount`: DECIMAL(10,2) NOT NULL
- `reference_version_id`: INT
- `status`: VARCHAR(20) DEFAULT 'completed'
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- UNIQUE KEY `idx_booking_tx` (`booking_id`, `transaction_type`)

### 13. `taxi_vendor_wallets` & `taxi_vendor_wallet_transactions`
Vendor margin credit balance and payout ledger.
- `vendor_id`: INT PRIMARY KEY
- `balance`: DECIMAL(12,2) DEFAULT 0.00
- `total_earned`: DECIMAL(12,2) DEFAULT 0.00

### 14. `taxi_association_wallets` & `taxi_association_wallet_transactions`
District Association wallet balances and credits.

### 15. Additional Supporting Tables
- `taxi_ride_gps_logs`: High-frequency driver location trace (`booking_id`, `latitude`, `longitude`, `speed`, `accuracy`).
- `taxi_sos_alerts`: Active emergency alerts triggered by passengers or drivers (`booking_id`, `user_type`, `latitude`, `longitude`, `status`).
- `taxi_booking_chats`: In-app messages (`booking_id`, `sender_role`, `sender_name`, `message`).
- `taxi_booking_calls`: WebRTC call logs (`booking_id`, `caller_role`, `status`, `duration_seconds`).
- `taxi_settings`: Dynamic system flags (`air_distance_restrict = '1'`).
- `taxi_offers`: Promo and discount codes (`code`, `description`, `discount_percent`, `max_discount`).

---

## 4. Vehicle Tariff Rate Matrices & Specifications

### Standard Tariff Matrix (Per Category & Vehicle Tier)

| Vehicle Type | Seating | Category | Base Fare (₹) | Min KM Threshold | Per KM Rate (₹) | Extra Hour Rate (₹) | Driver Allowance (₹) |
|---|---|---|---|---|---|---|---|
| **Bike** | 1 | Local | 0 | 5 km | ₹10 / km | — | — |
| **Bike** | 1 | One-Way | 0 | 5 km | ₹10 / km | — | — |
| **Bike Parcel** | 1 | Parcel | 30 | 0 km | ₹10 / km | — | — |
| **Auto** | 3 | Local | ₹60 | 0 km | ₹12 / km | — | — |
| **Auto** | 3 | One-Way | 0 | 50 km | ₹9 / km | — | — |
| **Auto** | 3 | Round Trip | 0 | 100 km / day | ₹8 / km | — | ₹400 / day |
| **Auto Parcel** | 3 | Parcel | ₹50 | 0 km | ₹14 / km | — | — |
| **Hatchback** | 4 | Local | ₹150 | 0 km | ₹20 / km | — | — |
| **Hatchback** | 4 | One-Way | 0 | 100 km | ₹11 / km | — | ₹400 (if >250km) |
| **Hatchback** | 4 | Round Trip | 0 | 200 km / day | ₹10 / km | — | ₹400 / day |
| **Sedan** | 4 | Local | ₹200 | 0 km | ₹25 / km | — | — |
| **Sedan** | 4 | One-Way | 0 | 130 km | ₹13 / km | — | ₹400 / ₹600 (>250km) |
| **Sedan** | 4 | Round Trip | 0 | 250 km / day | ₹12 / km | — | ₹400 / day |
| **Sedan Parcel** | 4 | Parcel | ₹80 | 0 km | ₹18 / km | — | — |
| **SUV** | 6-7 | Local | ₹300 | 0 km | ₹35 / km | — | — |
| **SUV** | 6-7 | One-Way | 0 | 130 km | ₹19 / km | — | ₹400 / ₹600 (>250km) |
| **SUV** | 6-7 | Round Trip | 0 | 250 km / day | ₹18 / km | — | ₹400 / day |
| **8+1 Seater** | 9 | Local | ₹600 | 0 km | ₹32 / km | — | — |
| **8+1 Seater** | 9 | One-Way | 0 | 150 km | ₹22 / km | — | ₹400 / ₹600 (>250km) |
| **8+1 Seater** | 9 | Round Trip | 0 | 250 km / day | ₹20 / km | — | ₹400 / day |
| **24-Seater Van**| 24 | Local | ₹1500 | 0 km | ₹55 / km | — | — |
| **24-Seater Van**| 24 | One-Way | 0 | 200 km | ₹42 / km | — | ₹400 / ₹600 (>250km) |
| **24-Seater Van**| 24 | Round Trip | 0 | 300 km / day | ₹38 / km | — | ₹400 / day |

---

### Hourly Rental Package Matrix

| Package Name | Included Mins | Included Distance | Auto Base (Extra Km/Hr) | Hatchback Base (Extra Km/Hr) | Sedan Base (Extra Km/Hr) | SUV Base (Extra Km/Hr) | 8+1 Seater Base (Extra Km/Hr) | 24-Seater Van Base (Extra Km/Hr) |
|---|---|---|---|---|---|---|---|---|
| **2 Hrs - 20 KM** | 120 mins | 20 km | ₹200 (₹10/km, ₹80/hr) | ₹450 (₹15/km, ₹120/hr) | ₹600 (₹18/km, ₹150/hr) | ₹900 (₹25/km, ₹250/hr) | ₹1,800 (₹30/km, ₹300/hr) | ₹4,000 (₹50/km, ₹500/hr) |
| **4 Hrs - 40 KM** | 240 mins | 40 km | ₹380 (₹10/km, ₹80/hr) | ₹850 (₹15/km, ₹120/hr) | ₹1,100 (₹18/km, ₹150/hr)| ₹1,600 (₹25/km, ₹250/hr) | ₹3,200 (₹30/km, ₹300/hr) | ₹7,000 (₹50/km, ₹500/hr) |
| **8 Hrs - 80 KM** | 480 mins | 80 km | ₹700 (₹9/km, ₹70/hr) | ₹1,600 (₹14/km, ₹100/hr)| ₹2,100 (₹16/km, ₹120/hr)| ₹3,100 (₹22/km, ₹200/hr) | ₹6,000 (₹28/km, ₹250/hr) | ₹13,000 (₹45/km, ₹450/hr)|
| **12 Hrs - 120 KM**| 720 mins | 120 km | ₹1,000 (₹9/km, ₹70/hr) | ₹2,200 (₹13/km, ₹100/hr)| ₹2,800 (₹15/km, ₹120/hr)| ₹4,200 (₹20/km, ₹200/hr) | ₹8,500 (₹25/km, ₹250/hr) | ₹18,000 (₹40/km, ₹400/hr)|

---

## 5. Pricing Engine, Peak Surge & Special Location Logic

### 1. Radial Air Distance Calculation (Haversine Formula)

City Ride Taxi computes direct air-distance between coordinates using the Haversine formula:

$$\Delta\phi = \frac{(\phi_2 - \phi_1) \cdot \pi}{180}, \quad \Delta\lambda = \frac{(\lambda_2 - \lambda_1) \cdot \pi}{180}$$

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\left(\frac{\phi_1 \cdot \pi}{180}\right) \cdot \cos\left(\frac{\phi_2 \cdot \pi}{180}\right) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right), \quad \text{distance} = R \cdot c \quad (R = 6371\text{ km})$$

- **Proximity Boundary**: Default base driver radial search radius is $10\text{ km}$.
- **Pickup Incentive Fee**: If nearest driver is beyond $10\text{ km}$, an air-distance incentive boost fee of ₹50 is added directly to driver earnings.

### 2. Peak Hour Surge Multiplier Logic
- Applied on `local` rides during active time windows defined in `taxi_peak_rules`.
- Default morning peak (`08:00` - `11:00`) and evening peak (`16:00` - `21:00`): **+25% surcharge** on base distance fare.

### 3. Special Location Destination Charges
Surcharge applied on base fare when pickup or drop matches configured POI types:
- Shopping Mall: +10%
- Cinema Theatre: +10%
- Beach / Waterfront: +15%
- Resort / Hotel: +15%
- Restaurant: +10%
- Railway Station: +5%

### 4. Waiting Time & Extra Stop Charges
- **Local Ride Waiting Time**: Grace period = $\text{Billable KM} \times 2$ minutes. Excess duration charged at **₹2 / minute**.
- **Rental Ride Waiting Time**: Grace period = Package hours $\times 60$ minutes. Excess duration charged at **₹2 / minute**.
- **Extra Intermediate Stops**: Charged at flat **₹50 per extra drop location**.

---

## 6. Financial Settlement & Ledger Engine (`commissionEngine.js`)

City Ride Taxi uses a prepaid driver wallet and post-ride cash settlement model:

1. **Prepaid Driver Wallet Debit on Accept**: When a driver accepts a booking, the system deducts the platform driver commission from their prepaid wallet (`wallet_balance`).
2. **Customer Cash Payment**: The passenger pays the total fare in cash to the driver at trip completion.
3. **Trip Settlement (`settleRideFinancials`)**:
   - Customer Platform Fee, District Fees, and Vendor Margins are debited from the driver's wallet (since driver collected them in cash).
   - Vendor Margin is credited to `taxi_vendor_wallets`.
   - All line items are recorded in `taxi_financial_ledger` for per-district accounting.

```
Total Fare Paid by Passenger (Cash to Driver)
  |-- Base Fare + Distance Charges (Driver Keep)
  |-- Driver Allowance / Waiting Fees (Driver Keep)
  |-- Customer Platform Fee ----------> Transferred to City Ride Taxi Revenue
  |-- District Customer & Driver Fee -> Transferred to Association Wallet / Settlement
  +-- Vendor Margin (if Vendor Ride) -> Transferred to Vendor Wallet
```

---

## 7. Comprehensive API Route Registry

### A. Authentication & User Management Module

#### `POST /api/auth/send-otp`
- **Access**: Public
- **Body**: `{ "phone": "9876543210" }`
- **Response**: `{ "success": true, "message": "OTP dispatched successfully" }`

#### `POST /api/auth/check-phone`
- **Access**: Public
- **Body**: `{ "phone": "9876543210" }`
- **Response**: `{ "exists": true, "name": "John" }`

#### `POST /api/auth/quick-login`
- **Access**: Public (Rate Limited)
- **Body**: `{ "phone": "9876543210", "password": "pass" }`
- **Response**: `{ "success": true, "token": "...", "user": { ... } }` (Sets `cr_usr_tok` HTTP Cookie)

#### `POST /api/auth/quick-register`
- **Access**: Public (Rate Limited)
- **Body**: `{ "phone": "9876543210", "name": "John", "password": "pass" }`
- **Response**: `{ "success": true, "user": { ... } }`

#### `POST /api/auth/register`
- **Access**: Public (Rate Limited)
- **Body**: `{ "name": "John", "phone": "...", "email": "...", "password": "...", "otp": "123456" }`

#### `POST /api/auth/login`
- **Access**: Public (Rate Limited)
- **Body**: `{ "login": "9876543210", "password": "..." }`

#### `POST /api/admin/login`
- **Access**: Public (Rate Limited)
- **Body**: `{ "username": "admin@cityridetaxi", "password": "..." }`
- **Response**: `{ "success": true, "token": "..." }` (Sets `cr_adm_tok`)

#### `POST /api/driver/login`
- **Access**: Public (Rate Limited)
- **Body**: `{ "phone": "...", "password": "..." }`
- **Response**: `{ "success": true, "token": "..." }` (Sets `cr_drv_tok`)

#### `POST /api/vendor/login`
- **Access**: Public (Rate Limited)
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "success": true, "token": "..." }` (Sets `cr_vnd_tok`)

#### `POST /api/association/login`
- **Access**: Public (Rate Limited)
- **Body**: `{ "username": "...", "password": "..." }`
- **Response**: `{ "success": true, "token": "..." }` (Sets `cr_assoc_tok`)

#### `GET /api/auth/session`
- **Access**: Public (Cookie Inspection)
- **Response**: `{ "user": { ... }, "role": "passenger" | "driver" | "vendor" | "admin" | "association" }`

#### `POST /api/auth/change-password`
- **Access**: Authenticated
- **Body**: `{ "oldPassword": "...", "newPassword": "..." }`

#### `POST /api/auth/delete-account`
- **Access**: Authenticated
- **Body**: `{ "reason": "..." }`

#### `POST /api/auth/logout`
- **Access**: Public
- **Response**: Clears all authentication HTTP cookies.

---

### B. Driver Registration & Approval Module

#### `POST /api/driver/register/send-otp`
- **Access**: Public
- **Body**: `{ "phone": "..." }`

#### `POST /api/driver/register/verify-otp`
- **Access**: Public
- **Body**: `{ "phone": "...", "otp": "..." }`

#### `POST /api/driver/register`
- **Access**: Public (Multipart Form Data)
- **Fields**: `name`, `phone`, `email`, `password`, `car_model`, `car_number`, `vehicle_type`, `seating_capacity`, `district`, `association_id`
- **Files**: `license_img`, `rc_img`, `insurance_img`, `association_id_card`, `profile_photo`
- **Process**: Compresses images to Base64, stores entry in `taxi_driver_applications` with `status = 'pending'`.

#### `GET /api/admin/driver-applications`
- **Access**: Admin / Association Admin
- **Response**: `[ { "id": 1, "name": "...", "status": "pending", ... } ]`

#### `POST /api/admin/driver-applications/decision`
- **Access**: Admin / Association Admin
- **Body**: `{ "application_id": 10, "decision": "approve" | "reject", "note": "Approved by Union" }`
- **Process**: On approval, migrates record from `taxi_driver_applications` to `taxi_drivers`, initializes driver wallet.

#### `GET /api/driver/info/:id`
- **Access**: Authenticated
- **Response**: Returns public profile, ratings, car info, and association details of driver.

#### `GET /api/driver/wallet-balance`
- **Access**: Driver
- **Response**: `{ "success": true, "balance": 450.50 }`

#### `POST /api/driver/wallet-payment-notify`
- **Access**: Driver
- **Body**: `{ "amount": 500, "transaction_ref": "UPI12345678" }`

---

### C. Ride Booking & Dispatch Lifecycle

#### `POST /api/bookings/create`
- **Access**: Passenger / Vendor / Admin
- **Payload**:
  ```json
  {
    "pickup": "Salem Bus Stand",
    "drop": "Junction Railway Station",
    "pickupCoords": "78.14,11.66",
    "dropCoords": "78.12,11.67",
    "vehicle_type": "sedan",
    "trip_type": "local",
    "association_id": 1,
    "special_place_type": "bus_stand",
    "extra_drops": ["Stop 1"]
  }
  ```
- **Response**: `{ "success": true, "bookingId": 1084, "fare": 240, "journey_otp": "4819" }`

#### `POST /api/bookings/check-air-distance`
- **Access**: Public
- **Body**: `{ "pickupCoords": "78.14,11.66", "baseRadiusKm": 10 }`
- **Response**: `{ "outOfRadius": false, "nearestDriverKm": 3.2, "incentiveRequired": false }`

#### `POST /api/bookings/:id/boost`
- **Access**: Passenger
- **Body**: `{ "boostAmount": 50 }`

#### `GET /api/bookings/fare-breakdown/:bookingId`
- **Access**: Authenticated
- **Response**: Detailed line items (base fare, distance fare, peak surge, location surcharge, platform fee, driver allowance).

#### `POST /api/bookings/accept`
- **Access**: Driver
- **Body**: `{ "bookingId": 1084 }`
- **Process**: Atomically assigns `driver_id = req.driver.id`, checks wallet balance $\ge$ commission fee, updates `status = 'accepted'`.

#### `POST /api/bookings/reached-pickup`
- **Access**: Driver
- **Body**: `{ "bookingId": 1084 }`
- **Process**: Updates status to `reached_pickup`, records `reached_pickup_time`.

#### `POST /api/bookings/start-journey`
- **Access**: Driver
- **Body**: `{ "bookingId": 1084, "otp": "4819" }`
- **Process**: Validates `journey_otp`, sets status to `ongoing`, records `journey_start_time`.

#### `POST /api/bookings/verify-delivery-otp`
- **Access**: Driver (Parcel rides)
- **Body**: `{ "bookingId": 1084, "endOtp": "9210" }`

#### `POST /api/bookings/finish-trip`
- **Access**: Driver
- **Body**: `{ "bookingId": 1084, "actualDistanceKm": 14.2 }`
- **Process**: Calculates final fare via `pricingEngine.js`, triggers `settleRideFinancials`, updates `status = 'completed'`.

#### `POST /api/user/cancel-ride`
- **Access**: Passenger
- **Body**: `{ "bookingId": 1084, "reason": "Passenger changed plans" }`

#### `POST /api/bookings/driver-cancel`
- **Access**: Driver
- **Body**: `{ "bookingId": 1084, "reason": "Traffic congestion" }`

---

### D. GPS Telemetry & Live Tracking

#### `POST /api/bookings/update-gps-location`
- **Access**: Driver
- **Body**: `{ "latitude": 11.6643, "longitude": 78.1422, "bookingId": 1084, "speed": 42.5 }`
- **Process**: Updates `taxi_drivers` position, inserts trace to `taxi_ride_gps_logs`, broadcasts Socket.IO location event.

#### `POST /api/bookings/upload-gps-logs-bulk`
- **Access**: Driver (Offline recovery sync)
- **Body**: `{ "logs": [ { "booking_id": 1084, "lat": 11.66, "lng": 78.14, "timestamp": "..." } ] }`

#### `GET /api/bookings/driver-location/:bookingId`
- **Access**: Authenticated
- **Response**: `{ "latitude": 11.6643, "longitude": 78.1422, "is_online": 1 }`

#### `GET /api/monitor/stream`
- **Access**: Admin / System Monitor
- **Response**: Server-Sent Events (SSE) stream delivering real-time request rates, error logs, and dispatch metrics.

---

### E. GIS Proxies & Routing Services

#### `GET /api/proxy/geocode`
- **Query**: `?q=Salem+Junction&limit=5`
- **Response**: OpenStreetMap / Nominatim geocoding predictions array.

#### `GET /api/proxy/reverse`
- **Query**: `?lat=11.6643&lon=78.1422`
- **Response**: `{ "display_name": "Suramangalam, Salem, Tamil Nadu" }`

#### `GET /api/proxy/route`
- **Query**: `?pickup=78.14,11.66&drop=78.12,11.67`
- **Response**: `{ "distance_km": 8.4, "duration_mins": 18, "polyline": "..." }`

---

### F. Support, In-App Chat & Emergency SOS Module

#### `GET /api/bookings/:id/chat`
- **Access**: Passenger / Driver / Admin
- **Response**: `[ { "sender_role": "driver", "sender_name": "Ramesh", "message": "I have arrived at pickup", "created_at": "..." } ]`

#### `POST /api/chat`
- **Access**: Passenger / Driver
- **Body**: `{ "bookingId": 1084, "senderRole": "passenger", "senderName": "John", "message": "Waiting near main gate" }`

#### `POST /api/support/ticket`
- **Access**: Authenticated
- **Body**: `{ "bookingId": 1084, "associationId": 1, "issueText": "Driver requested extra cash" }`

#### `POST /api/association/sos/trigger`
- **Access**: Passenger / Driver
- **Body**: `{ "bookingId": 1084, "latitude": 11.6643, "longitude": 78.1422 }`
- **Process**: Inserts alert into `taxi_sos_alerts`, triggers emergency web push broadcast to Association and Admin consoles.

#### `GET /api/association/sos/active`
- **Access**: Admin / Association Admin
- **Response**: Returns list of open high-priority SOS emergency incidents.

---

### G. Visual Database Manager Module (`/dbmanager`)

#### `GET /api/dbmanager/tables`
- **Access**: Super Admin
- **Response**: List of all 27 database tables in `railway` DB.

#### `GET /api/dbmanager/schema/:table`
- **Access**: Super Admin
- **Response**: Column names, data types, indexes, and primary key definitions.

#### `GET /api/dbmanager/rows/:table`
- **Access**: Super Admin
- **Query**: `?page=1&limit=50`
- **Response**: Paginated row records.

#### `POST /api/dbmanager/insert/:table`
- **Access**: Super Admin
- **Body**: Column key-value pairs for new row insertion.

#### `PUT /api/dbmanager/update/:table/:id`
- **Access**: Super Admin
- **Body**: Updated column key-value fields.

#### `DELETE /api/dbmanager/delete/:table/:id`
- **Access**: Super Admin
- **Response**: Direct database row deletion status.

---

## 8. Real-Time Socket.IO Messaging & Event Payload Specifications

The WebSockets server runs on port 3000 alongside Express.

### Client-to-Server Events

| Event Name | Sender Role | Payload | Description |
|---|---|---|---|
| `join_booking_room` | Passenger / Driver | `{ "bookingId": 1084 }` | Joins private socket channel for live ride updates |
| `update_location` | Driver | `{ "driverId": 5, "lat": 11.66, "lng": 78.14 }` | Emits live GPS coordinates to customer map |
| `send_in_ride_chat` | Passenger / Driver | `{ "bookingId": 1084, "message": "..." }` | Transmits real-time in-ride chat message |
| `webrtc_offer` | Caller | `{ "bookingId": 1084, "offer": { ... } }` | Transmits WebRTC SDP offer for in-app call |
| `webrtc_answer` | Callee | `{ "bookingId": 1084, "answer": { ... } }` | Transmits WebRTC SDP answer for in-app call |
| `webrtc_ice_candidate`| Peer | `{ "bookingId": 1084, "candidate": { ... } }` | Exchanges WebRTC ICE network candidates |

### Server-to-Client Broadcast Events

| Event Name | Recipient | Payload | Trigger Condition |
|---|---|---|---|
| `new_booking_broadcast` | Drivers in Scope | `{ "bookingId": 1084, "pickup": "...", "fare": 240 }` | Fired when new booking created matching vehicle & association |
| `driver_location_update`| Passenger | `{ "lat": 11.6643, "lng": 78.1422, "speed": 40 }` | Fired on driver GPS update |
| `ride_status_changed` | Passenger / Driver | `{ "bookingId": 1084, "status": "accepted" }` | Fired on ride state transition |
| `receive_in_ride_chat` | Passenger / Driver | `{ "sender": "Ramesh", "message": "..." }` | Delivered to room members |
| `sos_alert_broadcast` | Association / Admin | `{ "alertId": 12, "driverName": "...", "coords": "..." }` | Fired when emergency SOS button clicked |

---

## 9. Verification & System Test Scripts

Run the following Node.js test snippets in the server terminal to verify system integrity:

```bash
# 1. Test Association List Fetch
node -e "fetch('http://localhost:3000/api/public/associations').then(r=>r.json()).then(d=>console.log('Associations Count:', d.length))"

# 2. Test Active Tariff Config Query
node -e "fetch('http://localhost:3000/api/tariffs').then(r=>r.json()).then(d=>console.log('Tariff Keys:', Object.keys(d)))"

# 3. Test Peak Rules Config Query
node -e "fetch('http://localhost:3000/api/peak-rules').then(r=>r.json()).then(d=>console.log('Peak Rules:', d.length))"

# 4. Test Special Location Charges Query
node -e "fetch('http://localhost:3000/api/special-location-charges').then(r=>r.json()).then(d=>console.log('Special Locations:', d.length))"

# 5. Test Air Distance Proximity Verification
node -e "fetch('http://localhost:3000/api/bookings/check-air-distance', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pickupCoords:'78.14,11.66', baseRadiusKm:10})}).then(r=>r.json()).then(d=>console.log('Air Distance Check:', d))"
```

---
*End of Exhaustive City Ride Taxi Process, Data & Route Documentation.*
