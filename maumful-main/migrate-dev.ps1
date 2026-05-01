$files = @(
  "migrations/0001_initial_schema.sql",
  "migrations/0002_add_password_hash.sql",
  "migrations/0003_add_api_settings.sql",
  "migrations/0004_b2c_migration.sql",
  "migrations/0005_counseling.sql",
  "migrations/0006_stage3_admin.sql",
  "migrations/0007_subscriptions.sql",
  "migrations/0008_missing_tables.sql",
  "migrations/0009_referrals_fix.sql"
)

foreach ($f in $files) {
  Write-Host "=== $f ===" -ForegroundColor Cyan
  npx wrangler d1 execute maumful-db-dev --remote --yes --file=$f --config wrangler.dev.toml
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $f" -ForegroundColor Red
    exit 1
  }
}

Write-Host "=== D1_SQL (couple schema) ===" -ForegroundColor Cyan
npx wrangler d1 execute maumful-db-dev --remote --yes --file=../package/maumcouple/migrations/0001_couple_schema.sql --config wrangler.dev.toml

Write-Host "Done!" -ForegroundColor Green
