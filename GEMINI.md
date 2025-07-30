# Project: Cycle Parking Finder

## 1. Vision

To create a web application that helps cyclists in London find safe and secure parking for their bikes. The app will alleviate the pain point of finding a trustworthy place to leave a bicycle, reducing the risk of theft and inconvenience.

## 2. Core Problem

Cyclists with valuable bikes struggle to find safe parking in London. This creates anxiety and can be a barrier to cycling. The information about parking locations (both free public racks and private paid facilities) is fragmented and not easily accessible in one place.

## 3. High-Level Goals

*   **Find Parking:** The primary function is to allow users to search for and locate cycle parking near a specific location or destination.
*   **Safety & Trust:** Provide information that helps users assess the safety of a parking spot (e.g., user reviews, photos, security features).
*   **Comprehensive Data:** Aggregate data on different types of parking:
    *   Free, public cycle stands/racks.
    *   Paid, secure cycle-parking facilities (e.g., Cycle Hubs).
*   **Platform:** Start as a web application, with the potential to become a Progressive Web App (PWA) for a native-like experience on mobile devices.
*   **Monetization (Future):** Explore potential revenue streams, such as premium features or partnerships, once a solid user base is established.

## 4. Key Decisions

*   **Initial Platform:** Web Application (PWA).
*   **Geographic Focus:** London.

## 5. Data Strategy

*   **Primary Data Source:** We will start with an official dataset from Transport for London (TfL). The most promising source appears to be the **Cycling Infrastructure Database (CID)**, which contains comprehensive details on cycle parking locations, types, and capacity.
*   **Crowdsourcing:** Users will be able to contribute to the dataset by adding new parking locations that are not in the official data.
*   **Data Differentiation:** The application will visually distinguish between official (TfL) data and user-submitted data to ensure users can make informed decisions based on the data's origin.
*   **Future Potential:** The crowdsourced data could become a valuable asset, potentially enabling expansion to other cities or offering insights to local authorities.

## 6. Technology Stack & Hosting

*   **Frontend:** React with the **Next.js** framework.
*   **Backend:** Node.js, built as **API Routes** within the Next.js application.
*   **Database:** **PostgreSQL** with the **PostGIS** extension for handling geospatial data.
*   **Hosting:** **Vercel**, for its seamless integration with Next.js and simplified deployment workflow.

## 7. Feature Roadmap: Interactive Map View

1.  **Dynamic Map Loading:** Update the API to fetch parking locations based on the visible map area. Modify the map to automatically request and display these locations as the user pans and zooms, removing the "Search this area" button.
2.  **Performance Boost with Clustering:** Implement marker clustering to group nearby parking spots, improving map performance and user experience.
3.  **Detailed Information View:** Create a modal or sidebar that appears when a user clicks a marker, displaying detailed information about the parking location.
4.  **Zoomable Image Viewer:** Within the detailed view, make the location's photo clickable to open a full-screen, zoomable image viewer.

## 8. Development Workflow

*   **Branching:** All new features and bug fixes will be developed in a dedicated feature or fix branch, not directly on `main`.
*   **Merging:** Before merging a branch into `main`, I will request confirmation from the user.
