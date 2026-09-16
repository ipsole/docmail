// GET /openapi.json & POST /openapi.json (Root OpenAPI specification alias)
// Delegates to /api/v1/openapi.json for ChatGPT Actions and agent compatibility
export { GET, POST, OPTIONS } from '@/app/api/v1/openapi.json/route';
