# Test Organizations Creation Script
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTVjOTAxZjM0NDUxNWRiZWVmMDk3YTMiLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE3Njc2NzQzMDAsImV4cCI6MTc2Nzc2MDcwMH0.d2YkGVpachXGInd9xPnEUVb49JBOGvqYMH--N-qOXPo"

# Organization 1
$org1 = @{
    name = "ABC Engineering College"
    subdomain = "abc-eng"
    email = "admin@abc-eng.edu"
    phone = "+91-9876543210"
    address = "Mumbai, Maharashtra"
    subscriptionPlan = "professional"
} | ConvertTo-Json

Write-Host "Creating Organization 1..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "http://localhost:3000/api/superadmin/organizations" `
    -Method POST `
    -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} `
    -Body $org1 | Select-Object -ExpandProperty Content

Write-Host "`n" -ForegroundColor Green
