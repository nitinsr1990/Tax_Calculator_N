Indian Income Tax Calculator
===========================

What this app does
------------------
This is a client-side web app that estimates and compares income tax liability under the Old and New tax regimes for FY 2026-27.

The app guides a salaried individual through a simple step-by-step wizard:
- Basic info (age category, resident status)
- Income details (salary + other income)
- Deductions (80C, 80D, HRA, home loan interest, NPS, other deductions)
- Regime preference selection
- Review and calculate

It calculates both Old Regime and New Regime taxes in the browser, then shows a side-by-side summary, savings callout, and deduction headroom suggestions.

How to start and run
--------------------
1. Open a terminal in the project root:
   /Users/nitinsubramanyar/codebasics/AIPro/First_Web_app

2. Install dependencies (if needed):
   npm install

3. Start the app:
   npm start

4. Open the app in your browser using the port shown by the server, for example:
   http://localhost:3000

If port 3000 is in use, the server will automatically try the next available port (3001, 3002, etc.) when you run:
   PORT=3001 npm start

Then open the browser URL shown in the terminal.

Testing
-------
Run the tax engine tests with:
   npm test

Notes
-----
- The app is fully client-side with no backend calls.
- It uses FY 2026-27 tax slabs.
- Employer NPS 80CCD(2) is treated as user-entered capped value for this version.
- The app is intended for a resident salaried individual and excludes capital gains, business income, and other complex tax cases.
