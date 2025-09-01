# AI Observer - Project Analysis Report

Generated: 2025-09-01T16:40:37.203Z

## Project Information
- **Path**: /Users/rajatdhanda/Tech/Projects/ai-observer/test-projects/streax
- **Name**: streax
- **Framework**: Next.js 15.5.2
- **Type**: fullstack

## Type System Analysis
- **Total Types**: 63
- **Interfaces**: 61
- **Type Aliases**: 2
- **Enums**: 0

### Type Definitions
- **AppointmentCardProps** (component): 4 properties\n- **AvatarProps** (component): 9 properties\n- **BadgeProps** (component): 6 properties\n- **NavItem** (component): 4 properties\n- **ButtonProps** (component): 7 properties\n- **CardProps** (component): 9 properties\n- **CategoryCardProps** (component): 4 properties\n- **ClientCardProps** (component): 5 properties\n- **CourseCardProps** (component): 6 properties\n- **ImageProps** (component): 8 properties\n- **InputProps** (component): 8 properties\n- **ListProps** (component): 13 properties\n- **LiveSessionBannerProps** (component): 2 properties\n- **NavItem** (component): 5 properties\n- **NavBarProps** (component): 9 properties\n- **PageHeaderProps** (component): 6 properties\n- **PostCardProps** (component): 6 properties\n- **PostComposerProps** (component): 7 properties\n- **ProductCardProps** (component): 6 properties\n- **SearchBarProps** (component): 4 properties\n- **ServiceCardProps** (component): 4 properties\n- **SheetProps** (component): 8 properties\n- **SkeletonProps** (component): 6 properties\n- **StatsCardProps** (component): 4 properties\n- **Tab** (component): 3 properties\n- **TabsProps** (component): 4 properties\n- **Professional** (database): 20 properties\n- **Post** (database): 18 properties\n- **PostEngagement** (database): 5 properties\n- **Comment** (database): 9 properties\n- **LiveSession** (database): 19 properties\n- **Product** (database): 24 properties\n- **Order** (database): 19 properties\n- **OrderItem** (database): 7 properties\n- **InsurancePolicy** (database): 15 properties\n- **InsuranceClaim** (database): 14 properties\n- **Client** (database): 20 properties\n- **Appointment** (database): 16 properties\n- **ServiceItem** (database): 5 properties\n- **Course** (database): 21 properties\n- **CourseEnrollment** (database): 12 properties\n- **Address** (database): 7 properties\n- **Notification** (database): 11 properties\n- **Analytics** (database): 12 properties\n- **User** (database): 10 properties\n- **Post** (database): 14 properties\n- **Comment** (database): 7 properties\n- **LiveSession** (database): 11 properties\n- **Product** (database): 11 properties\n- **CartItem** (database): 4 properties\n- **Order** (database): 9 properties\n- **OrderItem** (database): 4 properties\n- **InsurancePolicy** (database): 9 properties\n- **InsuranceClaim** (database): 11 properties\n- **Client** (database): 14 properties\n- **Appointment** (database): 11 properties\n- **Course** (database): 15 properties\n- **CourseProgress** (database): 8 properties\n- **NavItem** (database): 5 properties\n- **ApiResponse** (database): 3 properties\n- **PaginatedResponse** (database): 5 properties

## Business Entities

### Professional
- **Type**: general
- **Properties**: 20
- **Relationships**: hasMany Post, hasMany PostEngagement, hasMany Comment, hasMany Order, hasMany InsurancePolicy, hasMany InsuranceClaim, hasMany Client, hasMany Appointment, hasMany CourseEnrollment, hasMany Notification, hasMany Analytics
- **Operations**: createProfessional, getProfessional, updateProfessional, deleteProfessional, listProfessionals

### Post
- **Type**: content
- **Properties**: 18
- **Relationships**: belongsTo Professional, hasMany PostEngagement, hasMany Comment
- **Operations**: createPost, getPost, updatePost, deletePost, listPosts...

### PostEngagement
- **Type**: content
- **Properties**: 5
- **Relationships**: belongsTo Post, belongsTo Professional
- **Operations**: createPostEngagement, getPostEngagement, updatePostEngagement, deletePostEngagement, listPostEngagements...

### Comment
- **Type**: content
- **Properties**: 9
- **Relationships**: belongsTo Post, belongsTo Professional
- **Operations**: createComment, getComment, updateComment, deleteComment, listComments...

### LiveSession
- **Type**: general
- **Properties**: 19
- **Relationships**: None
- **Operations**: createLiveSession, getLiveSession, updateLiveSession, deleteLiveSession, listLiveSessions

### Product
- **Type**: product
- **Properties**: 24
- **Relationships**: hasMany OrderItem, hasMany CartItem
- **Operations**: createProduct, getProduct, updateProduct, deleteProduct, listProducts

### Order
- **Type**: transaction
- **Properties**: 19
- **Relationships**: belongsTo Professional, hasMany OrderItem
- **Operations**: createOrder, getOrder, updateOrder, deleteOrder, listOrders...

### OrderItem
- **Type**: product
- **Properties**: 7
- **Relationships**: belongsTo Order, belongsTo Product
- **Operations**: createOrderItem, getOrderItem, updateOrderItem, deleteOrderItem, listOrderItems

### InsurancePolicy
- **Type**: general
- **Properties**: 15
- **Relationships**: belongsTo Professional
- **Operations**: createInsurancePolicy, getInsurancePolicy, updateInsurancePolicy, deleteInsurancePolicy, listInsurancePolicys

### InsuranceClaim
- **Type**: general
- **Properties**: 14
- **Relationships**: belongsTo Professional
- **Operations**: createInsuranceClaim, getInsuranceClaim, updateInsuranceClaim, deleteInsuranceClaim, listInsuranceClaims

### Client
- **Type**: general
- **Properties**: 20
- **Relationships**: belongsTo Professional, hasMany Appointment
- **Operations**: createClient, getClient, updateClient, deleteClient, listClients

### Appointment
- **Type**: general
- **Properties**: 16
- **Relationships**: belongsTo Professional, belongsTo Client
- **Operations**: createAppointment, getAppointment, updateAppointment, deleteAppointment, listAppointments

### ServiceItem
- **Type**: product
- **Properties**: 5
- **Relationships**: None
- **Operations**: createServiceItem, getServiceItem, updateServiceItem, deleteServiceItem, listServiceItems

### Course
- **Type**: general
- **Properties**: 21
- **Relationships**: hasMany CourseEnrollment, hasMany CourseProgress
- **Operations**: createCourse, getCourse, updateCourse, deleteCourse, listCourses

### CourseEnrollment
- **Type**: general
- **Properties**: 12
- **Relationships**: belongsTo Course, belongsTo Professional
- **Operations**: createCourseEnrollment, getCourseEnrollment, updateCourseEnrollment, deleteCourseEnrollment, listCourseEnrollments

### Address
- **Type**: general
- **Properties**: 7
- **Relationships**: None
- **Operations**: createAddress, getAddress, updateAddress, deleteAddress, listAddresss

### Notification
- **Type**: general
- **Properties**: 11
- **Relationships**: belongsTo Professional
- **Operations**: createNotification, getNotification, updateNotification, deleteNotification, listNotifications

### Analytics
- **Type**: general
- **Properties**: 12
- **Relationships**: belongsTo Professional
- **Operations**: createAnalytics, getAnalytics, updateAnalytics, deleteAnalytics, listAnalyticss

### User
- **Type**: user
- **Properties**: 10
- **Relationships**: hasMany Post, hasMany Comment, hasMany Order, hasMany InsurancePolicy, hasMany InsuranceClaim, hasMany Client, hasMany Appointment, hasMany CourseProgress
- **Operations**: createUser, getUser, updateUser, deleteUser, listUsers...

### Post
- **Type**: content
- **Properties**: 14
- **Relationships**: belongsTo User
- **Operations**: createPost, getPost, updatePost, deletePost, listPosts...

### Comment
- **Type**: content
- **Properties**: 7
- **Relationships**: belongsTo Post, belongsTo User
- **Operations**: createComment, getComment, updateComment, deleteComment, listComments...

### LiveSession
- **Type**: general
- **Properties**: 11
- **Relationships**: None
- **Operations**: createLiveSession, getLiveSession, updateLiveSession, deleteLiveSession, listLiveSessions

### Product
- **Type**: product
- **Properties**: 11
- **Relationships**: None
- **Operations**: createProduct, getProduct, updateProduct, deleteProduct, listProducts

### CartItem
- **Type**: product
- **Properties**: 4
- **Relationships**: belongsTo Product
- **Operations**: createCartItem, getCartItem, updateCartItem, deleteCartItem, listCartItems

### Order
- **Type**: transaction
- **Properties**: 9
- **Relationships**: belongsTo User
- **Operations**: createOrder, getOrder, updateOrder, deleteOrder, listOrders...

### OrderItem
- **Type**: product
- **Properties**: 4
- **Relationships**: belongsTo Product
- **Operations**: createOrderItem, getOrderItem, updateOrderItem, deleteOrderItem, listOrderItems

### InsurancePolicy
- **Type**: general
- **Properties**: 9
- **Relationships**: belongsTo User
- **Operations**: createInsurancePolicy, getInsurancePolicy, updateInsurancePolicy, deleteInsurancePolicy, listInsurancePolicys

### InsuranceClaim
- **Type**: general
- **Properties**: 11
- **Relationships**: belongsTo User
- **Operations**: createInsuranceClaim, getInsuranceClaim, updateInsuranceClaim, deleteInsuranceClaim, listInsuranceClaims

### Client
- **Type**: general
- **Properties**: 14
- **Relationships**: belongsTo User
- **Operations**: createClient, getClient, updateClient, deleteClient, listClients

### Appointment
- **Type**: general
- **Properties**: 11
- **Relationships**: belongsTo Client, belongsTo User
- **Operations**: createAppointment, getAppointment, updateAppointment, deleteAppointment, listAppointments

### Course
- **Type**: general
- **Properties**: 15
- **Relationships**: None
- **Operations**: createCourse, getCourse, updateCourse, deleteCourse, listCourses

### CourseProgress
- **Type**: general
- **Properties**: 8
- **Relationships**: belongsTo Course, belongsTo User
- **Operations**: createCourseProgress, getCourseProgress, updateCourseProgress, deleteCourseProgress, listCourseProgresss

### NavItem
- **Type**: product
- **Properties**: 5
- **Relationships**: None
- **Operations**: createNavItem, getNavItem, updateNavItem, deleteNavItem, listNavItems

### ApiResponse
- **Type**: general
- **Properties**: 3
- **Relationships**: None
- **Operations**: createApiResponse, getApiResponse, updateApiResponse, deleteApiResponse, listApiResponses

### PaginatedResponse
- **Type**: general
- **Properties**: 5
- **Relationships**: None
- **Operations**: createPaginatedResponse, getPaginatedResponse, updatePaginatedResponse, deletePaginatedResponse, listPaginatedResponses

### CategoryCardProps
- **Type**: taxonomy
- **Properties**: 4
- **Relationships**: None
- **Operations**: createCategoryCardProps, getCategoryCardProps, updateCategoryCardProps, deleteCategoryCardProps, listCategoryCardPropss

### ClientCardProps
- **Type**: general
- **Properties**: 5
- **Relationships**: None
- **Operations**: createClientCardProps, getClientCardProps, updateClientCardProps, deleteClientCardProps, listClientCardPropss

### LiveSessionBannerProps
- **Type**: general
- **Properties**: 2
- **Relationships**: None
- **Operations**: createLiveSessionBannerProps, getLiveSessionBannerProps, updateLiveSessionBannerProps, deleteLiveSessionBannerProps, listLiveSessionBannerPropss

### PostCardProps
- **Type**: content
- **Properties**: 6
- **Relationships**: None
- **Operations**: createPostCardProps, getPostCardProps, updatePostCardProps, deletePostCardProps, listPostCardPropss...

### PostComposerProps
- **Type**: content
- **Properties**: 7
- **Relationships**: None
- **Operations**: createPostComposerProps, getPostComposerProps, updatePostComposerProps, deletePostComposerProps, listPostComposerPropss...

### ProductCardProps
- **Type**: product
- **Properties**: 6
- **Relationships**: None
- **Operations**: createProductCardProps, getProductCardProps, updateProductCardProps, deleteProductCardProps, listProductCardPropss


## Data Flow Architecture

### Layers

- **Database** (database)
  - Components: Professional, Post, PostEngagement, Comment, LiveSession, Product, Order, OrderItem, InsurancePolicy, InsuranceClaim...

- **State Management** (state)
  - Components: useAuth, useClients, useFeed, useInsurance, useLearning, useProducts

- **UI Components** (ui)
  - Components: appointment-card, avatar, badge, bottom-nav, button, card, category-card, client-card, course-card, image...


### Critical Paths

- **Authentication** (high)
  - Flow: Login Form → API Auth → Session Storage → Protected Routes

- **Data Operations** (high)
  - Flow: UI Form → Validation → API Request → Database Operation → Response

- **Page Rendering** (medium)
  - Flow: Route Request → Data Fetching → Component Render → Client Hydration


## Validation Rules

### Summary
- **Total Rules**: 837
- **Auto-generated**: 837
- **Custom**: 0

### Rules by Type
- **type**: 740 rules\n- **business**: 51 rules\n- **performance**: 43 rules\n- **security**: 3 rules

### Rules by Severity
- **error**: 791 rules\n- **warning**: 45 rules\n- **info**: 1 rules

## Recommendations

1. **Type Coverage**: Ensure all API endpoints have corresponding TypeScript interfaces
2. **Validation**: Implement the generated validation rules in your codebase
3. **Performance**: Review performance rules for optimization opportunities
4. **Security**: Address all security rules with 'error' severity immediately

---
*Generated by AI Observer*
