import { relations } from 'drizzle-orm';
import { analyticsEvents, pageViews, searchHistory } from './analytics';
import { permissions, profiles, rolePermissions, roles, sessions, users } from './auth';
import { customerAddresses, customerAlerts, customerProfiles, customers, customerSettings, customerWishlist } from './customers';
import { dealerActivity, dealerAssignments, dealerProfiles, dealers } from './dealers';
import { documentCategories, documents, documentVersions } from './documents';
import { featuredVehicles, vehicleCompare, vehicleEnquiries, vehicleViews, vehicleWishlist } from './marketplace';
import { emailLogs, messages, messageThreads, notifications } from './messages';
import { orderDocuments, orderItems, orderNotes, orders, orderStatus, orderTimeline } from './orders';
import { currencies, exchangeRates, invoices, paymentHistory, paymentMethods, payments } from './payments';
import { countries, emailTemplates, languages, siteSettings, systemSettings } from './settings';
import { containers, ports, shipments, shipmentTracking, shippingDocuments } from './shipping';
import {
  bodyTypes,
  colors,
  driveTypes,
  fuelTypes,
  manufacturers,
  models,
  transmissions,
  vehicleDocuments,
  vehicleFeatures,
  vehicleImages,
  vehicles,
  vehicleSpecifications,
  vehicleStatus,
  vehicleVideos,
} from './vehicles';

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  sessions: many(sessions),
  orders: many(orders),
  messagesSent: many(messages, { relationName: 'messages_sender' }),
  messagesReceived: many(messages, { relationName: 'messages_recipient' }),
  notifications: many(notifications),
  analyticsEvents: many(analyticsEvents),
  pageViews: many(pageViews),
  searchHistory: many(searchHistory),
  vehicleViews: many(vehicleViews),
  compareEntries: many(vehicleCompare),
  wishlistEntries: many(vehicleWishlist),
  enquiries: many(vehicleEnquiries),
  documents: many(documents),
  payments: many(payments),
  paymentMethods: many(paymentMethods),
  customer: one(customers, { fields: [users.id], references: [customers.userId] }),
  dealer: one(dealers, { fields: [users.id], references: [dealers.userId] }),
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  createdBy: many(users, { relationName: 'created_by_users' }),
  updatedBy: many(users, { relationName: 'updated_by_users' }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
  models: many(models),
  vehicles: many(vehicles),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
  manufacturer: one(manufacturers, { fields: [models.manufacturerId], references: [manufacturers.id] }),
  vehicles: many(vehicles),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  manufacturer: one(manufacturers, { fields: [vehicles.manufacturerId], references: [manufacturers.id] }),
  model: one(models, { fields: [vehicles.modelId], references: [models.id] }),
  country: one(countries, { fields: [vehicles.countryId], references: [countries.id] }),
  bodyType: one(bodyTypes, { fields: [vehicles.bodyTypeId], references: [bodyTypes.id] }),
  fuelType: one(fuelTypes, { fields: [vehicles.fuelTypeId], references: [fuelTypes.id] }),
  transmission: one(transmissions, { fields: [vehicles.transmissionId], references: [transmissions.id] }),
  driveType: one(driveTypes, { fields: [vehicles.driveTypeId], references: [driveTypes.id] }),
  color: one(colors, { fields: [vehicles.colorId], references: [colors.id] }),
  currency: one(currencies, { fields: [vehicles.currencyId], references: [currencies.id] }),
  port: one(ports, { fields: [vehicles.portId], references: [ports.id] }),
  images: many(vehicleImages),
  videos: many(vehicleVideos),
  documents: many(vehicleDocuments),
  features: many(vehicleFeatures),
  specifications: many(vehicleSpecifications),
  statuses: many(vehicleStatus),
  featuredVehicles: many(featuredVehicles),
  vehicleViews: many(vehicleViews),
  compareEntries: many(vehicleCompare),
  wishlistEntries: many(vehicleWishlist),
  enquiries: many(vehicleEnquiries),
  orders: many(orders),
  orderItems: many(orderItems),
}));

export const vehicleImagesRelations = relations(vehicleImages, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleImages.vehicleId], references: [vehicles.id] }),
}));

export const vehicleVideosRelations = relations(vehicleVideos, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleVideos.vehicleId], references: [vehicles.id] }),
}));

export const vehicleDocumentsRelations = relations(vehicleDocuments, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleDocuments.vehicleId], references: [vehicles.id] }),
}));

export const vehicleFeaturesRelations = relations(vehicleFeatures, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleFeatures.vehicleId], references: [vehicles.id] }),
}));

export const vehicleSpecificationsRelations = relations(vehicleSpecifications, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleSpecifications.vehicleId], references: [vehicles.id] }),
}));

export const vehicleStatusRelations = relations(vehicleStatus, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleStatus.vehicleId], references: [vehicles.id] }),
}));

export const featuredVehiclesRelations = relations(featuredVehicles, ({ one }) => ({
  vehicle: one(vehicles, { fields: [featuredVehicles.vehicleId], references: [vehicles.id] }),
}));

export const vehicleViewsRelations = relations(vehicleViews, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleViews.vehicleId], references: [vehicles.id] }),
  user: one(users, { fields: [vehicleViews.userId], references: [users.id] }),
}));

export const vehicleCompareRelations = relations(vehicleCompare, ({ one }) => ({
  user: one(users, { fields: [vehicleCompare.userId], references: [users.id] }),
  vehicle: one(vehicles, { fields: [vehicleCompare.vehicleId], references: [vehicles.id] }),
}));

export const vehicleWishlistRelations = relations(vehicleWishlist, ({ one }) => ({
  user: one(users, { fields: [vehicleWishlist.userId], references: [users.id] }),
  vehicle: one(vehicles, { fields: [vehicleWishlist.vehicleId], references: [vehicles.id] }),
}));

export const vehicleEnquiriesRelations = relations(vehicleEnquiries, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleEnquiries.vehicleId], references: [vehicles.id] }),
  user: one(users, { fields: [vehicleEnquiries.userId], references: [users.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  profile: one(customerProfiles, { fields: [customers.id], references: [customerProfiles.customerId] }),
  settings: many(customerSettings),
  addresses: many(customerAddresses),
  wishlist: many(customerWishlist),
  alerts: many(customerAlerts),
  orders: many(orders),
}));

export const customerProfilesRelations = relations(customerProfiles, ({ one }) => ({
  customer: one(customers, { fields: [customerProfiles.customerId], references: [customers.id] }),
}));

export const customerSettingsRelations = relations(customerSettings, ({ one }) => ({
  customer: one(customers, { fields: [customerSettings.customerId], references: [customers.id] }),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, { fields: [customerAddresses.customerId], references: [customers.id] }),
}));

export const customerWishlistRelations = relations(customerWishlist, ({ one }) => ({
  customer: one(customers, { fields: [customerWishlist.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [customerWishlist.vehicleId], references: [vehicles.id] }),
}));

export const customerAlertsRelations = relations(customerAlerts, ({ one }) => ({
  customer: one(customers, { fields: [customerAlerts.customerId], references: [customers.id] }),
}));

export const dealersRelations = relations(dealers, ({ one, many }) => ({
  user: one(users, { fields: [dealers.userId], references: [users.id] }),
  profile: one(dealerProfiles, { fields: [dealers.id], references: [dealerProfiles.dealerId] }),
  assignments: many(dealerAssignments),
  activity: many(dealerActivity),
  orders: many(orders),
}));

export const dealerProfilesRelations = relations(dealerProfiles, ({ one }) => ({
  dealer: one(dealers, { fields: [dealerProfiles.dealerId], references: [dealers.id] }),
}));

export const dealerAssignmentsRelations = relations(dealerAssignments, ({ one }) => ({
  dealer: one(dealers, { fields: [dealerAssignments.dealerId], references: [dealers.id] }),
  order: one(orders, { fields: [dealerAssignments.orderId], references: [orders.id] }),
}));

export const dealerActivityRelations = relations(dealerActivity, ({ one }) => ({
  dealer: one(dealers, { fields: [dealerActivity.dealerId], references: [dealers.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  dealer: one(dealers, { fields: [orders.dealerId], references: [dealers.id] }),
  vehicle: one(vehicles, { fields: [orders.vehicleId], references: [vehicles.id] }),
  items: many(orderItems),
  statusHistory: many(orderStatus),
  timeline: many(orderTimeline),
  documents: many(orderDocuments),
  notes: many(orderNotes),
  payments: many(payments),
  shipments: many(shipments),
  invoices: many(invoices),
  dealerAssignments: many(dealerAssignments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  vehicle: one(vehicles, { fields: [orderItems.vehicleId], references: [vehicles.id] }),
}));

export const orderStatusRelations = relations(orderStatus, ({ one }) => ({
  order: one(orders, { fields: [orderStatus.orderId], references: [orders.id] }),
}));

export const orderTimelineRelations = relations(orderTimeline, ({ one }) => ({
  order: one(orders, { fields: [orderTimeline.orderId], references: [orders.id] }),
}));

export const orderDocumentsRelations = relations(orderDocuments, ({ one }) => ({
  order: one(orders, { fields: [orderDocuments.orderId], references: [orders.id] }),
}));

export const orderNotesRelations = relations(orderNotes, ({ one }) => ({
  order: one(orders, { fields: [orderNotes.orderId], references: [orders.id] }),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  order: one(orders, { fields: [shipments.orderId], references: [orders.id] }),
  tracking: many(shipmentTracking),
  containers: many(containers),
  documents: many(shippingDocuments),
}));

export const shipmentTrackingRelations = relations(shipmentTracking, ({ one }) => ({
  shipment: one(shipments, { fields: [shipmentTracking.shipmentId], references: [shipments.id] }),
}));

export const containersRelations = relations(containers, ({ one }) => ({
  shipment: one(shipments, { fields: [containers.shipmentId], references: [shipments.id] }),
}));

export const shippingDocumentsRelations = relations(shippingDocuments, ({ one }) => ({
  shipment: one(shipments, { fields: [shippingDocuments.shipmentId], references: [shipments.id] }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  history: many(paymentHistory),
}));

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  payment: one(payments, { fields: [paymentHistory.paymentId], references: [payments.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, { fields: [paymentMethods.userId], references: [users.id] }),
}));

export const currenciesRelations = relations(currencies, ({ many }) => ({
  exchangeRates: many(exchangeRates),
  vehicles: many(vehicles),
}));

export const portsRelations = relations(ports, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const bodyTypesRelations = relations(bodyTypes, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const fuelTypesRelations = relations(fuelTypes, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const transmissionsRelations = relations(transmissions, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const driveTypesRelations = relations(driveTypes, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const colorsRelations = relations(colors, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  currency: one(currencies, { fields: [exchangeRates.currencyId], references: [currencies.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, { fields: [invoices.orderId], references: [orders.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: 'messages_sender' }),
  recipient: one(users, { fields: [messages.recipientId], references: [users.id], relationName: 'messages_recipient' }),
  thread: one(messageThreads, { fields: [messages.threadId], references: [messageThreads.id] }),
}));

export const messageThreadsRelations = relations(messageThreads, ({ many }) => ({
  messages: many(messages),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(users, { fields: [emailLogs.recipient], references: [users.email] }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  vehicle: one(vehicles, { fields: [documents.vehicleId], references: [vehicles.id] }),
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  versions: many(documentVersions),
}));

export const documentCategoriesRelations = relations(documentCategories, ({ many }) => ({
  documents: many(documents),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, { fields: [documentVersions.documentId], references: [documents.id] }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, { fields: [analyticsEvents.userId], references: [users.id] }),
}));

export const pageViewsRelations = relations(pageViews, ({ one }) => ({
  user: one(users, { fields: [pageViews.userId], references: [users.id] }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, { fields: [searchHistory.userId], references: [users.id] }),
}));

export const countriesRelations = relations(countries, ({ many }) => ({
  profiles: many(profiles),
  vehicles: many(vehicles),
}));

export const languagesRelations = relations(languages, ({ many }) => ({
  profiles: many(profiles),
}));

export const siteSettingsRelations = relations(siteSettings, ({}) => ({}));
export const systemSettingsRelations = relations(systemSettings, ({}) => ({}));
export const emailTemplatesRelations = relations(emailTemplates, ({}) => ({}));
