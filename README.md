# PDFViewerWidget
An extension to show a (very basic) PDF viewer.

**This Extension is provided as-is and without warranty or support. It is not part of the PTC product suite and there is no PTC support.**

## Description
This extension provides a widget to show a (very basic) PDF viewer; the widget allows to provide a platform-independent user experience.

## Properties
- debugMode - BOOLEAN (default = false): if set to true it sends to the browser's JS console a set of information useful for debugging the widget
- url - STRING (no default value): the URL to retrieve the PDF
- showSizingButtons - BOOLEAN (default = true): true to display the resizing buttons

## Services
- Load: service to load the PDF

## Events
- Loaded: event to notify that the PDF has been loaded
- Failed: event to notify that the PDF loading has failed

## LocalizationTables
This extension adds the following localization token (Default, it and de languages):
- PDFViewerWidget.pdfviewer.page (default = 'Page')
- PDFViewerWidget.pdfviewer.fitpage (default = 'Fit Page')
- PDFViewerWidget.pdfviewer.fitwidth (default = 'Fit Width')
- PDFViewerWidget.pdfviewer.error (default = 'The file is not available or is not a valid PDF document')

## Dependencies
- pdf.js - [link](https://mozilla.github.io/pdf.js/)

## Donate
If you would like to support the development of this and/or other extensions, consider making a [donation](https://www.paypal.com/donate/?business=HCDX9BAEYDF4C&no_recurring=0&currency_code=EUR).
