# Portapay Server Changelog

## 1.0.2 (2/16/2022)

- in file `kinvey.ts` funtion `updatePaymentStatus`, do not reject webhook if no results were found (could be a credit card `charge.succeeded`)

## 1.0.1 (2/11/2022)

- in file `charge.ts` remove function `create-new_card`

## 1.0.0 (2/9/2022)

- first version in use for production
