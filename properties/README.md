# Property detail pages

Each property page lives at:

`properties/<Property Page Slug>/index.html`

The permanent slug comes from the Google Sheet column `Property Page Slug`. The main portfolio page automatically shows `View property →` for any row with a slug, so the link survives later status changes from Proposed to Under Contract or Closed.

## Add another property

1. Add a unique `Property Page Slug` to the property's spreadsheet row, for example `1649-rambling-brook-drive`.
2. Copy an existing property folder under `properties/` and rename the folder to that exact slug.
3. In the copied `index.html`, set `<body data-property-slug="...">` to the same slug and replace the property-specific narrative, address, builder/lot information, links and media filenames.
4. Put that property's images in `images/` and walkthrough video in `video/` inside the property folder.
5. Do not manually duplicate the financial underwriting. `assets/property-page-data.js` loads the same published Google Sheet as the portfolio page and fills the financial fields from the row whose `Property Page Slug` matches the page.

The resulting shareable URL is the GitHub Pages site root plus `/properties/<slug>/`.

## Shared visual and number rules

Every property page must load `../../assets/property-page-theme.css` after its page-specific styles. The shared theme mirrors the portfolio page: charcoal background, warm off-white primary text, one muted gray, green for operating/actual financial data, blue for forecast appreciation, and champagne only for brand/availability accents. Proposed status is champagne; Under Contract and Closed use green.

Financial display formatting follows the portfolio page:

- Dollar amounts: nearest whole dollar, with no decimal places.
- Rates, returns, appreciation, and other calculated percentages: one decimal place.
- Down-payment percentages and simple purchase-leverage figures: whole numbers.
- Effective leverage: one decimal place.
- Non-financial measurements keep the precision needed by the source (for example floor-plan feet/inches or an intentionally abbreviated population figure).

Pages using `assets/property-page-data.js` inherit the dollar and percentage formatting automatically. Do not hard-code alternate financial precision in a property page.
