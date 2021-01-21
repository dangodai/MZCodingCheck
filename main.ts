/**
 * MarshallZehr coding check
 * Currency conversion CLI tool
 */

import moment from 'moment';
import axios from 'axios';
import currency from 'currency.js';

// Set of allowed currencies
const currencies = new Set(['CAD', 'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CHF', 'CNY', 'HKD', 'MXN', 'INR']);

/**
 * Currency conversion options
 */
interface ConversionOptions {
    sourceCurrencyValue: currency;
    sourceCurrencyISOCode: string;
    targetCurrencyISOCode: string;
    exchangeDate: moment.Moment;
}

/**
 * Result of a currency conversion (includes all of the conversion options
 * and the exchange rate used).
 */
interface ConversionResult extends ConversionOptions {
    exchangeRate: number;
    exchangeResult: currency;
}

/**
 * Response from the BoC valet API (though, only the fields we will be using)
 */
interface ValetObservationResult {
    observations: {
        d: string;
    }[] & {
        [key: string]: {
            v: string;
        };
    }[]
}

/**
 * Main program workflow
 */
async function main(): Promise<void> {
    let options = parseOptions();

    const conversionResult = await convertCurrency(options);

    console.log(JSON.stringify(conversionResult, null, 4));
}

/**
 * Converts currencies using the provided options. Contacts the BoC API to get
 * the exchange rate.
 * 
 * @param options Conversion options (Initial value, currencies, date)
 */
async function convertCurrency(options: ConversionOptions): Promise<ConversionResult> {
    const currencyPair = `${options.sourceCurrencyISOCode + options.targetCurrencyISOCode}`;

    const response: ValetObservationResult = (await axios.get(`/observations/FX${currencyPair}`, {
        baseURL: 'https://www.bankofcanada.ca/valet',
        params: {
            start_date: moment(options.exchangeDate).subtract(6, 'days').format('YYYY-MM-DD'),
            end_date: options.exchangeDate.format('YYYY-MM-DD'),
            order_dir: 'desc'
        },
        responseType: 'json'
    })).data;

    const exchangeRate = parseFloat(response.observations[0][`FX${currencyPair}`].v);
    const exchangeResult = options.sourceCurrencyValue.multiply(exchangeRate);

    return {
        ...options,
        exchangeDate: moment(response.observations[0].d),
        exchangeRate,
        exchangeResult
    };
}

/**
 * Parse the command line arguments into a ConversionOptions object
 */
function parseOptions(): ConversionOptions {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        printHelpAndExit('Not enough arguments were provided')
    }

    const sourceCurrencyISOCode = args[1].toUpperCase();
    const targetCurrencyISOCode = args[2].toUpperCase();

    if (sourceCurrencyISOCode !== 'CAD' && targetCurrencyISOCode !== 'CAD') {
        printHelpAndExit('Neither of the provided currency codes are CAD. Only conversions involving CAD are supported');
    }

    if (!currencies.has(sourceCurrencyISOCode) || !currencies.has(targetCurrencyISOCode)) {
        printHelpAndExit(`One or more provided currency codes are not supported. Supported codes: ${[...currencies]}`);
    }

    const options: ConversionOptions = {
        sourceCurrencyValue: currency(args[0], { precision: 4 }),
        sourceCurrencyISOCode,
        targetCurrencyISOCode,
        exchangeDate: args[3] != null ? moment(args[3], 'YYYY-MM-DD') : moment()
    };

    return options;
}

/**
 * Prints a help menu and exits.
 * 
 * @param errorMessage Optional error message to print before showing the help menu
 */
function printHelpAndExit(errorMessage?: string): never {
    if (errorMessage != null) {
        console.log(`Error: ${errorMessage}`);
        console.log('');
    }

    console.log('Usage: node main.js source_currency_value source_currency target_currency [exchange_date]');
    console.log('');
    console.log('Both the source and target currency must be ISO currency codes from the following list: ');
    console.log(`   ${[...currencies]}`);
    console.log('One of the currencies MUST be CAD');
    console.log('');
    console.log('Exchange dates must be provided in the format YYYY-MM-DD');
    console.log('');
    console.log('Example 1: node main.js 123.45 CAD USD');
    console.log('Example 2: node main.js 123.45 CAD USD 2020-02-02');

    process.exit(1);
}

main();