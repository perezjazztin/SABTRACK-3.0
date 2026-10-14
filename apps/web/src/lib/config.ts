/**
 * Application environment configuration for the web frontend.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const APP_CONFIG = {
  title: 'SABTRACK 3.0',
  officialTitle:
    'SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling, Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang',
  community: 'Barangay Sabang, Lipa City, Batangas',
  version: '3.0.0-dev',
};
