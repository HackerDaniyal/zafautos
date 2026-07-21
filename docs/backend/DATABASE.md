# ZafAutos Japan — Backend Architecture

## Database Tables (48 total)

### Authentication & Users
| Table | Purpose |
|-------|---------|
| `users` | Core user records with role enum |
| `profiles` | User display info (name, phone, avatar) |
| `sessions` | Server-side session tracking |
| `roles` | Role definitions (super_admin, admin, dealer, customer) |
| `permissions` | Granular permission slugs |
| `role_permissions` | Many-to-many role↔permission |

### Vehicles
| Table | Purpose |
|-------|---------|
| `vehicles` | Core vehicle listing |
| `vehicle_images` | Photo gallery per vehicle |
| `vehicle_videos` | Video links |
| `vehicle_documents` | PDFs, inspection reports |
| `vehicle_features` | Feature list (ABS, Airbags, etc.) |
| `vehicle_specifications` | Key-value spec pairs |
| `vehicle_status` | Status history log |

### Reference Data
| Table | Purpose |
|-------|---------|
| `manufacturers` | Make/brand (Toyota, Honda, etc.) |
| `models` | Model per manufacturer |
| `body_types` | Sedan, SUV, Hatchback, etc. |
| `fuel_types` | Petrol, Diesel, Hybrid, etc. |
| `transmissions` | Automatic, Manual, CVT |
| `drive_types` | FWD, RWD, AWD |
| `colors` | Color names |
| `countries` | Destination countries |
| `ports` | Shipping ports |
| `currencies` | USD, JPY, KES |
| `exchange_rates` | Currency conversion rates |

### Customers
| Table | Purpose |
|-------|---------|
| `customers` | Customer record (linked to users) |
| `customer_profiles` | Display name, preferences |
| `customer_settings` | JSON preferences |
| `customer_addresses` | Shipping/billing addresses |
| `customer_wishlist` | Saved vehicles |
| `customer_alerts` | Search alerts |

### Dealers
| Table | Purpose |
|-------|---------|
| `dealers` | Dealer record (linked to users) |
| `dealer_profiles` | Business name, info |
| `dealer_assignments` | Order↔dealer mapping |
| `dealer_activity` | Activity log |

### Orders & Commerce
| Table | Purpose |
|-------|---------|
| `orders` | Purchase orders |
| `order_items` | Line items per order |
| `order_status` | Status history |
| `order_timeline` | Event timeline |
| `order_documents` | Attached files |
| `order_notes` | Internal notes |

### Payments
| Table | Purpose |
|-------|---------|
| `payments` | Payment records |
| `payment_history` | Status change log |
| `payment_methods` | Saved payment methods |
| `invoices` | Invoice records |

### Shipping
| Table | Purpose |
|-------|---------|
| `shipments` | Shipment records |
| `shipment_tracking` | Location/status updates |
| `containers` | Container assignments |
| `shipping_documents` | B/L, packing lists |

### Communications
| Table | Purpose |
|-------|---------|
| `messages` | Direct messages |
| `message_threads` | Conversation threads |
| `notifications` | Push/in-app notifications |
| `email_logs` | Email delivery log |

### Documents
| Table | Purpose |
|-------|---------|
| `documents` | General document storage |
| `document_categories` | Category labels |
| `document_versions` | Version history |

### Marketplace Engagement
| Table | Purpose |
|-------|---------|
| `featured_vehicles` | Homepage featured list |
| `vehicle_views` | View tracking |
| `vehicle_compare` | Comparison lists |
| `vehicle_wishlist` | User wishlists |
| `vehicle_enquiries` | Enquiry submissions |

### Analytics
| Table | Purpose |
|-------|---------|
| `analytics_events` | Custom events |
| `page_views` | Page visit tracking |
| `search_history` | Search query log |

### Settings
| Table | Purpose |
|-------|---------|
| `site_settings` | Key-value site config |
| `system_settings` | Key-value system config |
| `email_templates` | Email template store |
| `languages` | Language codes |

## ER Diagram (Mermaid)

```mermaid
erDiagram
    users ||--o| profiles : has
    users ||--o{ sessions : has
    users ||--o| customers : is
    users ||--o| dealers : is
    users }o--|| roles : belongs_to
    roles ||--o{ role_permissions : has
    permissions ||--o{ role_permissions : has

    customers ||--o{ customer_profiles : has
    customers ||--o{ customer_settings : has
    customers ||--o{ customer_addresses : has
    customers ||--o{ customer_wishlist : has
    customers ||--o{ customer_alerts : has

    dealers ||--o{ dealer_profiles : has
    dealers ||--o{ dealer_assignments : has
    dealers ||--o{ dealer_activity : has

    manufacturers ||--o{ models : has
    manufacturers ||--o{ vehicles : produces
    models ||--o{ vehicles : has
    body_types ||--o{ vehicles : categorizes
    fuel_types ||--o{ vehicles : powers
    transmissions ||--o{ vehicles : drives
    drive_types ||--o{ vehicles : moves
    colors ||--o{ vehicles : paints
    countries ||--o{ vehicles : ships_to
    ports ||--o{ vehicles : ships_from
    currencies ||--o{ vehicles : priced_in

    vehicles ||--o{ vehicle_images : has
    vehicles ||--o{ vehicle_videos : has
    vehicles ||--o{ vehicle_documents : has
    vehicles ||--o{ vehicle_features : has
    vehicles ||--o{ vehicle_specifications : has
    vehicles ||--o{ vehicle_status : has
    vehicles ||--o{ orders : purchased_in
    vehicles ||--o{ vehicle_views : tracked_by
    vehicles ||--o{ vehicle_compare : compared_in
    vehicles ||--o{ vehicle_wishlist : wished_in
    vehicles ||--o{ vehicle_enquiries : enquired_about
    vehicles ||--o{ featured_vehicles : featured_in

    orders ||--o{ order_items : contains
    orders ||--o{ order_status : tracked_by
    orders ||--o{ order_timeline : has
    orders ||--o{ order_documents : has
    orders ||--o{ order_notes : has
    orders ||--o{ payments : paid_via
    orders ||--o{ shipments : shipped_via
    orders ||--o{ invoices : invoiced_as
    orders }o--o{ dealers : assigned_to

    payments ||--o{ payment_history : tracked_by
    payments }o--o{ users : belongs_to

    shipments ||--o{ shipment_tracking : tracked_by
    shipments ||--o{ containers : contains
    shipments ||--o{ shipping_documents : has

    messages }o--o{ message_threads : in
    messages }o--o| users : sender
    messages }o--o| users : recipient
    notifications }o--|| users : belongs_to
```
