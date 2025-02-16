const { views } = require('govuk-prototype-kit')
const { DateTime, Settings } = require('luxon')
const { normalize } = require('./utils.js')

Settings.throwOnInvalid = true

/**
 * Convert an ISO 8601 date time to a human readable date that follows the
 * GOV.UK style.
 *
 * @see {@link https://www.gov.uk/guidance/style-guide/a-to-z-of-gov-uk-style#dates}
 *
 * @example <caption>Full date</caption>
 * govukDate('2021-08-17') // 17 August 2021
 *
 * @example <caption>Full date (truncated)</caption>
 * govukDate('2021-08-17', 'truncate') // 17 Aug 2021
 *
 * @example <caption>Month and year only</caption>
 * govukDate('2021-08') // August 2021
 *
 * @example <caption>Month and year only (truncated)</caption>
 * govukDate('2021-08', 'truncate') // Aug 2021
 *
 * @example <caption>Today’s date</caption>
 * govukDate('today') // 21 October 2021
 * govukDate('today', 'truncate') // 21 Oct 2021
 *
 * @param {string} string - Date
 * @param {boolean|string} [format=false] - Date format (currently accepts ‘truncate’)
 * @returns {string} `string` as a human readable date
 */
function govukDate (string, format = false) {
  string = normalize(string, '')

  try {
    if (string === 'today' || string === 'now') {
      string = DateTime.now().toString()
    }

    const isoDateRegex = /^\d{4}-(?:[0]\d|1[0-2])$/
    const dateHasNoDay = isoDateRegex.test(string)
    const truncateDate = format === 'truncate'
    const date = DateTime.fromISO(string)

    // 2021-08 => August 2021
    // 2021-08 => Aug 2021 (truncated)
    if (dateHasNoDay) {
      const tokens = truncateDate ? 'MMM yyyy' : 'MMMM yyyy'
      return date.toFormat(tokens)
    }

    // 2021-08-17 => 17 August 2021
    // 2021-08-17 => 17 Aug 2021 (truncated)
    const preset = truncateDate ? 'DATE_MED' : 'DATE_FULL'
    return date.setLocale('en-GB').toLocaleString(DateTime[preset])
  } catch (error) {
    return error.message.split(':')[0]
  }
}

/**
 * Format an ISO 8601 date time or time to a human readable time that follows
 * the GOV.UK style.
 *
 * @see {@link https://www.gov.uk/guidance/style-guide/a-to-z-of-gov-uk-style#times}
 *
 * @example <caption>Full date time</caption>
 * govukTime('2021-08-17T18:30:00') // 6:30pm
 *
 * @example <caption>Full date time (which is midnight)</caption>
 * govukTime('2021-08-17T00:00:59') // midnight
 *
 * @example <caption>Full date time (which is midday)</caption>
 * govukTime('2021-08-17T12:00:59') // midday
 *
 * @example <caption>Time only</caption>
 * govukTime('18:30') // 6:30pm
 *
 * @example <caption>The time now</caption>
 * govukTime('now') // 10:45pm
 *
 * @param {string} string - Time
 * @returns {string} `string` as a human readable time
 */
function govukTime (string) {
  string = normalize(string, '')

  try {
    if (string === 'now' || string === 'today') {
      string = DateTime.now().toString()
    }

    const date = DateTime.fromISO(string)

    // If o’clock, don’t show the minutes past the hour
    const hour = date.toFormat('h:mm').replace(':00', '')

    // Use a lowercase meridiem indicator
    const meridiem = date.toFormat('a').toLowerCase()

    // Show the hour followed by meridiem indicator (no space)
    let time = `${hour}${meridiem}`

    // If the time is 12:00am, show ‘midnight’ instead
    if (time === '12am') {
      time = 'midnight'
    }

    // If the time is 12:00pm, show ‘midday’ instead
    if (time === '12pm') {
      time = 'midday'
    }

    return time
  } catch (error) {
    return error.message.split(':')[0]
  }
}

/**
 * Convert `govukDateInput` values to an ISO 8601 date.
 *
 * The `govukDateInput` creates separate values for its component for `day`,
 * `month` and `year` values, optionally prefixed with a `namePrefix`.
 *
 * `namePrefix` is optional, and intended for the simplistic use case where
 * date values are saved at the top level of prototype session data.
 *
 * If no `namePrefix` is provided, assumes author is setting custom names for
 * each component value and storing session data in a nested object.
 *
 * @example <caption>With namePrefix</caption>
 * data = {
 *   'dob-day': '01',
 *   'dob-month': '02',
 *   'dob-year: '2012'
 * }
 * isoDateFromDateInput(data, 'dob') // 2012-02-01
 *
 * @example <caption>Without namePrefix, month and year only</caption>
 * data = {
 *   issued: {
 *     month: '02',
 *     year: '2012'
 *   }
 * }
 * isoDateFromDateInput(data.issued) // 2012-02
 *
 * @param {object} object - Object containing date values
 * @param {string} [namePrefix] - `namePrefix` used for date values
 * @returns {string} ISO 8601 date string
 */
function isoDateFromDateInput (object, namePrefix) {
  let day, month, year

  if (namePrefix) {
    day = Number(object[`${namePrefix}-day`])
    month = Number(object[`${namePrefix}-month`])
    year = Number(object[`${namePrefix}-year`])
  } else {
    day = Number(object?.day)
    month = Number(object?.month)
    year = Number(object?.year)
  }

  try {
    if (!day) {
      return DateTime.local(year, month).toFormat('yyyy-LL')
    } else {
      return DateTime.local(year, month, day).toISODate()
    }
  } catch (error) {
    return error.message.split(':')[0]
  }
}

module.exports = {
  govukDate,
  govukTime,
  isoDateFromDateInput
}

// Add date filters to GOV.UK Prototype Kit
views.addFilter('govukDate', govukDate)
views.addFilter('govukTime', govukTime)
views.addFilter('isoDateFromDateInput', isoDateFromDateInput)
