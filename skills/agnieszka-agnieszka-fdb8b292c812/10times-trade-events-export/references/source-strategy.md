# Source Strategy and Limits

## Safe Source Order

Use this order of preference:

1. existing workspace schema examples
2. public 10times sitemap index
3. existing local WHR/10times dumps
4. manually supplied user files

## Public Collection Strategy

- Use `https://10times.com/xml/sitemaps.xml`
- Keep only base event URLs with a single path segment after the domain
- Save the result as a public inventory

## Known Limits

### Cloudflare blocks on event detail pages

Direct HTTP fetches of many 10times event pages may return pages like:

- `Attention Required! | Cloudflare`
- `Sorry, you have been blocked`
- login or quick-check interstitials

When this happens:

- stop detail scraping
- do not attempt bypasses
- continue with sitemap inventory + local dump reuse

### WHR endpoint authentication

Public access to the WHR-aligned API may return:

- `401 Incorrect or Expired Cookies`

When this happens:

- do not treat the endpoint as public
- do not try to recreate or bypass the missing session
- reuse existing local CSV + raw JSON dumps instead
- clearly mark the enriched export as coming from local previously collected data

