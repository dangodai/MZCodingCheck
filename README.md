# MZ Coding Check

## Compiling

After checking out the repo

```
npm install
npm run compile
```

This will produce a `main.js` file that you can run (see Usage below)

## Usage

```
Usage: node main.js source_currency_value source_currency target_currency [exchange_date]

Both the source and target currency must be ISO currency codes from the following list: 
   CAD,USD,EUR,JPY,GBP,AUD,CHF,CNY,HKD,MXN,INR
One of the currencies MUST be CAD

Exchange dates must be provided in the format YYYY-MM-DD
```

```
Example 1: node main.js 123.45 CAD USD
Example 2: node main.js 123.45 CAD USD 2020-02-02
```

## Assumptions

* Restrictions on using libraries/packages were not mentioned. I have kept usage minimal, but a package is notably used
for handling currency multiplication (no point in risking floating point errors!)
* When the requested conversion date does not have an exchange rate (presumably any day markets are closed), I use the
most recent date up to a week old. I have no idea if this would be proper real world behaviour, but the result's date
may not match the input date for this reason.
* Error handling was not mentioned, so it is not thorough. Basic checks are there to help you enter something valid
but handling is otherwise absent.