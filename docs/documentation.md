FORMAT: 1A
HOST: http://polls.apiblueprint.org/

# Sales purchases

Sales purchases is a API allowing consumers.

## Type document Collection [/type-documents]

### List All Type document [GET]

- Response 200 (application/json)

        [
            {
                "comTypeDocumentId": 1,
                "comCompanyId": 1,
                "documentType":
                    {
                        "id": 1,
                        "name": "BOLETA",
                        "code": "BOL",
                        "description": "Descripción de Boleta"
                    }
            },
            {
                "comTypeDocumentId": 2,
                "comCompanyId": 1,
                "documentType":
                    {
                        "id": 1,
                        "name": "FACTURA",
                        "code": "FAC",
                        "description": "Descripción de Factura"
                    }
            },
            {
                "comTypeDocumentId": 3,
                "comCompanyId": 1,
                "documentType":
                    {
                        "id": 1,
                        "name": "NOTA DE VENTA",
                        "code": "NTV",
                        "description": "Descripción de Nota de Venta"
                    }
            }
        ]

### Create a New Type document [POST]

You can create your own type document using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "comCountryId": 1,
            "name": "Type of document 1",
            "flagType": 1,
            "code": "TDOC1",
            "description": "Description of type of document 1"
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "comCountryId": 1,
              "name": "Type of document 1",
              "flagType": 1,
              "code": "TDOC1",
              "description": "Description of type of document 1",
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-02 12:36:38",
              "updatedAt": "2018-01-02 12:36:38",
              "id": 12
          }

## Type document Collection [/type-documents/{typeDocumentId}]

### List details Type document [GET]

- Response 200 (application/json)

        {
            "id": 12,
            "comCountryId": 1,
            "name": "Type of document 1",
            "flagType": 1,
            "code": "TDOC1",
            "description": "Description of type of document 1",
            "flagActive": 1,
            "createdAt": "2018-01-02T17:36:38.000Z",
            "updatedAt": "2018-01-02T17:36:38.000Z"
        }

### Update a Type document [PATCH]

You can update your own type document using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "comCountryId": 1,
            "name": "update Type of document 1",
            "flagType": 1,
            "code": "upd TDOC1",
            "description": "Description of type of document 1"
        }

- Response 400 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          1

### Delete a Type document [DELETE]

- Response 200 (application/json)

        1

## Customer Collection [/customers]

### List All Customer [GET]

- Response 200 (application/json)

        [
            {
                "id": 1,
                "dni": "44132287",
                "ruc": null,
                "email": "japi@mail.com",
                "flagTypePerson": 1,
                "comCompaniesId": 1,
                "flagActive": 1,
                "address": null,
                "contact": null,
                "name": "Japi",
                "lastname": "Sale",
                "rzSocial": null
            },
            {
                "id": 2,
                "dni": null,
                "ruc": "20292005483",
                "email": "japi@business.com",
                "flagTypePerson": 2,
                "comCompaniesId": 1,
                "flagActive": 1,
                "address": null,
                "contact": null,
                "name": null,
                "lastname": null,
                "rzSocial": "Japi SAC"
            },
            {
                "id": 3,
                "dni": "44132287",
                "ruc": null,
                "email": "dominguez@gmail.com",
                "flagTypePerson": 1,
                "comCompaniesId": 1,
                "flagActive": 1,
                "address": null,
                "contact": null,
                "name": null,
                "lastname": null,
                "rzSocial": null
            }
        ]

## Customer Collection [/customers/amount]

### List All Customer amount [GET]

- Response 200 (application/json)

        [
            {
                "id": 1,
                "dni": "44132287",
                "ruc": null,
                "email": "japi@mail.com",
                "flagTypePerson": 1,
                "comCompaniesId": 1,
                "flagActive": 1,
                "address": null,
                "contact": null,
                "name": "Japi",
                "lastname": "Sale",
                "rzSocial": null,
                "amountCustomer": 742.56
            },
            {
                "id": 2,
                "dni": null,
                "ruc": "20292005483",
                "email": "japi@business.com",
                "flagTypePerson": 2,
                "comCompaniesId": 1,
                "flagActive": 1,
                "address": null,
                "contact": null,
                "name": null,
                "lastname": null,
                "rzSocial": "Japi SAC",
                "amountCustomer": 118
            }
        ]

### Create a New Customer [POST]

You can create your own customer using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "flagTypePerson": 1,
            "ruc": "",
            "dni": "001392684",
            "email": "dominguez@gmail.com",
            "phone": "970127070",
            "gender": 1
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "flagTypePerson": 1,
              "ruc": "",
              "dni": "001392684",
              "email": "dominguez@gmail.com",
              "phone": "970127070",
              "gender": 1,
              "comCompaniesId: 1,
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-03 11:05:27",
              "updatedAt": "2018-01-03 11:05:27",
              "id": 34
          }

## Customer Collection [/customers/{customerId}]

### List details Customer [GET]

- Response 200 (application/json)

        {
            "id": 34,
            "comCompaniesId": 1,
            "name": null,
            "lastname": null,
            "rzSocial": null,
            "websiteAddress": null,
            "nationality": null,
            "email": "dominguez@gmail.com",
            "phone": "970127070",
            "ruc": "",
            "dni": "001392684",
            "gender": 1,
            "dateBirth": null,
            "civilStatus": null,
            "sonNumber": null,
            "contact": null,
            "address": null,
            "urlImage": null,
            "flagTypePerson": 1,
            "flagActive": 1,
            "deletedAt": null,
            "createdAt": "2018-01-03T16:05:27.000Z",
            "updatedAt": "2018-01-03T16:05:27.000Z"
        }

### Update a Customer [PATCH]

You can update your own customer using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "flagTypePerson": 2,
            "ruc": "12312312312",
            "dni": "001392684",
            "email": "jose.dominguez@gmail.com",
            "phone": "970127070",
            "gender": 1,
        }

- Response 400 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          1

### Delete a Customer [DELETE]

- Response 200 (application/json)

        1

## Employee Collection [/employee]

### List All Employee [GET]

- Response 200 (application/json)

        [
            {
                "id": 1,
                "code": null,
                "roleId": 1,
                "appId": 1,
                "housekeepingScore": null,
                "comSubsidiariesId": 1,
                "comMsStateEmpId": 1,
                "warWarehousesId": 1,
                "salTerminalsId": 1,
                "name": "Japi",
                "lastname": "Sale",
                "nationality": null,
                "email": "japi@mail.com",
                "phone": null,
                "gender": null,
                "dateBirth": null,
                "civilStatus": null,
                "sonNumber": null,
                "group": null,
                "dateHealing": null,
                "languages": null,
                "subsidiaries": null,
                "urlImage": null,
                "tokenDevice": null,
                "flagAdmin": null
            },
            {
                "id": 34,
                "code": "001",
                "roleId": 1,
                "appId": 1,
                "housekeepingScore": 1,
                "comSubsidiariesId": 1,
                "comMsStateEmpId": 1,
                "warWarehousesId": 1,
                "salTerminalsId": 1,
                "name": "nombre",
                "lastname": "apellido",
                "nationality": "peruvian",
                "email": "employee@empresa.com",
                "phone": "3454543543",
                "gender": 1,
                "dateBirth": "2018-01-03T05:00:00.000Z",
                "civilStatus": 1,
                "sonNumber": 1,
                "group": 1,
                "dateHealing": "2018-01-03T05:00:00.000Z",
                "languages": "[]",
                "subsidiaries": "[]",
                "urlImage": "/image.png",
                "tokenDevice": "123",
                "flagAdmin": 0
            }
        ]

### Create a New employee [POST]

You can create your own employee using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "code": "001",
            "roleId": 1,
            "appId": 1,
            "housekeepingScore": 1,
            "comSubsidiariesId": 1,
            "comMsStateEmpId": 1,
            "warWarehousesId": 1,
            "salTerminalsId": 1,
            "name": "nombre",
            "lastname": "apellido",
            "nationality": "peruvian",
            "email": "employee@empresa.com",
            "phone": "3454543543",
            "gender": 1,
            "dateBirth": "2018-01-03T05:00:00.000Z",
            "civilStatus": 1,
            "sonNumber": 1,
            "group": 1,
            "dateHealing": "2018-01-03T05:00:00.000Z",
            "languages": "[]",
            "subsidiaries": "[]",
            "urlImage": "/image.png",
            "tokenDevice": "123",
            "flagAdmin": 0
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "code": "001",
              "roleId": 1,
              "appId": 1,
              "housekeepingScore": 1,
              "comSubsidiariesId": 1,
              "comMsStateEmpId": 1,
              "warWarehousesId": 1,
              "salTerminalsId": 1,
              "name": "nombre",
              "lastname": "apellido",
              "nationality": "peruvian",
              "email": "employee@empresa.com",
              "phone": "3454543543",
              "gender": 1,
              "dateBirth": "2018-01-03T16:05:29.478Z",
              "civilStatus": 1,
              "sonNumber": 1,
              "group": 1,
              "dateHealing": "2018-01-03T16:05:29.478Z",
              "languages": "[]",
              "subsidiaries": "[]",
              "urlImage": "/image.png",
              "tokenDevice": "123",
              "flagAdmin": 0,
              "companyId": 1,
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-03 11:05:29",
              "updatedAt": "2018-01-03 11:05:29",
              "id": 34
          }

## employee Collection [/employee/{employeeId}]

### List details employee [GET]

- Response 200 (application/json)

        {
            "id": 34,
            "code": "001",
            "roleId": 1,
            "appId": 1,
            "housekeepingScore": 1,
            "comSubsidiariesId": 1,
            "comMsStateEmpId": 1,
            "warWarehousesId": 1,
            "salTerminalsId": 1,
            "name": "nombre",
            "lastname": "apellido",
            "nationality": "peruvian",
            "email": "employee@empresa.com",
            "phone": "3454543543",
            "gender": 1,
            "dateBirth": "2018-01-03T05:00:00.000Z",
            "civilStatus": 1,
            "sonNumber": 1,
            "group": 1,
            "dateHealing": "2018-01-03T05:00:00.000Z",
            "languages": "[]",
            "subsidiaries": "[]",
            "urlImage": "/image.png",
            "tokenDevice": "123",
            "flagAdmin": 0,
            "companyId": 1,
            "flagActive": 1,
            "deletedAt": null,
            "createdAt": "2018-01-03T16:05:29.000Z",
            "updatedAt": "2018-01-03T16:05:29.000Z"
        }

### Update a employee [PATCH]

You can update your own employee using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "code": "001",
            "roleId": 1,
            "appId": 1,
            "housekeepingScore": 1,
            "comSubsidiariesId": 1,
            "comMsStateEmpId": 1,
            "warWarehousesId": 1,
            "salTerminalsId": 1,
            "name": "zombie",
            "lastname": "cerebro",
            "nationality": "peruvian",
            "email": "zombie@cerebro.com",
            "phone": "3454543543",
            "gender": 1,
            "dateBirth": "2018-01-03T16:05:27.000Z",
            "civilStatus": 1,
            "sonNumber": 1,
            "group": 1,
            "dateHealing": "2018-01-03T16:05:27.000Z",
            "languages": "[]",
            "subsidiaries": "[]",
            "urlImage": "/image.png",
            "tokenDevice": "123",
            "flagAdmin": 0
        }

- Response 400 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          1

### Delete a employee [DELETE]

- Response 200 (application/json)

        1

## Series Collection [/series]

### List All Series [GET]

- Response 200 (application/json)

        [
            {
                "comSubsidiariesId": 1,
                "salTerminalsId": 1,
                "salTypeDocumentsId": 1,
                "serie": "001",
                "number": "1"
            },
            {
                "comSubsidiariesId": 1,
                "salTerminalsId": 1,
                "salTypeDocumentsId": 2,
                "serie": "002",
                "number": "3"
            },
            {
                "comSubsidiariesId": 1,
                "salTerminalsId": 1,
                "salTypeDocumentsId": 3,
                "serie": "003",
                "number": "1"
            },
            {
                "comSubsidiariesId": 1,
                "salTerminalsId": 1,
                "salTypeDocumentsId": 4,
                "serie": "004",
                "number": "1"
            },
            {
                "comSubsidiariesId": 1,
                "salTerminalsId": 1,
                "salTypeDocumentsId": 1,
                "serie": "001",
                "number": "1"
            }
        ]

### Create a New Series [POST]

You can create your own series using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "comSubsidiariesId": 1,
            "salTerminalsId": 1,
            "salTypeDocumentsId": 1,
            "serie": "001",
            "number": "1",
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "comSubsidiariesId": 1,
              "salTerminalsId": 1,
              "salTypeDocumentsId": 1,
              "serie": "001",
              "number": "1",
              "companyId": 1,
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-03 13:20:47",
              "updatedAt": "2018-01-03 13:20:47",
              "id": 9
          }

## Series Collection [/series/{serieId}]

### List details Series [GET]

- Response 200 (application/json)

        {
            "id": 9,
            "comSubsidiariesId": 1,
            "salTerminalsId": 1,
            "salTypeDocumentsId": 1,
            "serie": "001",
            "number": "1",
            "companyId": 1,
            "flagActive": 1,
            "deletedAt": null,
            "createdAt": "2018-01-03T18:20:47.000Z",
            "updatedAt": "2018-01-03T18:20:47.000Z"
        }

### Update a Series [PATCH]

You can update your own series using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "comSubsidiariesId": 1,
            "salTerminalsId": 1,
            "salTypeDocumentsId": 1,
            "serie": "001",
            "number": "2"
        }

- Response 400 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          1

### Delete a Series [DELETE]

- Response 200 (application/json)

        1

## Sales document Collection [/sale-documents]

### List All Sales document [GET]

- Response 200 (application/json)

        [
            {
                "id": 1,
                "amount": 118,
                "amountCash": 118,
                "amountCredit": 0,
                "creditCardName": null,
                "subtotal": 100,
                "taxes": 18,
                "currency": "PEN",
                "commentary": null,
                "discount": 0,
                "exchangeAmount": 3.29,
                "number": "1",
                "serie": "002",
                "comEmployeeId": 1,
                "customerId": null,
                "customer":
                {
                    "id": 1,
                    "dni": "44132287",
                    "ruc": null,
                    "email": "japi@mail.com",
                    "flagTypePerson": 1,
                    "comCompaniesId": 1,
                    "flagActive": 1,
                    "address": null,
                    "contact": null,
                    "name": "Japi",
                    "lastname": "Sale",
                    "rzSocial": null
                },
                "employee":
                {
                    "id": 1,
                    "code": null,
                    "roleId": 1,
                    "appId": 1,
                    "housekeepingScore": null,
                    "comSubsidiariesId": 1,
                    "comMsStateEmpId": 1,
                    "warWarehousesId": 1,
                    "salTerminalsId": 1,
                    "name": "Japi",
                    "lastname": "Sale",
                    "nationality": null,
                    "email": "japi@mail.com",
                    "phone": null,
                    "gender": null,
                    "dateBirth": null,
                    "civilStatus": null,
                    "sonNumber": null,
                    "group": null,
                    "dateHealing": null,
                    "languages": null,
                    "subsidiaries": null,
                    "urlImage": null,
                    "tokenDevice": null,
                    "flagAdmin": null
                },
                "details":
                [
                    {
                        "brandId": 1,
                        "discount": 0,
                        "quantity": 10,
                        "price": 20,
                        "productType": 1,
                        "stockQuantity": 1,
                        "warProductsId": 1,
                        "warWarehousesId": 1
                    },
                    {
                        "brandId": 1,
                        "discount": 0,
                        "quantity": 6,
                        "price": 3.5,
                        "productType": 1,
                        "stockQuantity": 1,
                        "warProductsId": 1,
                        "warWarehousesId": 1
                    }
                ]
            },
            {
                "id": 2,
                "amount": 90,
                "amountCash": 40,
                "amountCredit": 50,
                "creditCardName": "VISA",
                "subtotal": 80,
                "taxes": 10,
                "currency": "PEN",
                "commentary": null,
                "discount": 0,
                "exchangeAmount": 3.29,
                "number": "2",
                "serie": "002",
                "comEmployeeId": 1,
                "customerId": null,
                "customer": null,
                "employee":
                {
                    "id": 1,
                    "code": null,
                    "roleId": 1,
                    "appId": 1,
                    "housekeepingScore": null,
                    "comSubsidiariesId": 1,
                    "comMsStateEmpId": 1,
                    "warWarehousesId": 1,
                    "salTerminalsId": 1,
                    "name": "Japi",
                    "lastname": "Sale",
                    "nationality": null,
                    "email": "japi@mail.com",
                    "phone": null,
                    "gender": null,
                    "dateBirth": null,
                    "civilStatus": null,
                    "sonNumber": null,
                    "group": null,
                    "dateHealing": null,
                    "languages": null,
                    "subsidiaries": null,
                    "urlImage": null,
                    "tokenDevice": null,
                    "flagAdmin": null
                },
                "details":
                [
                    {
                        "brandId": 1,
                        "discount": 0,
                        "quantity": 10,
                        "price": 20,
                        "productType": 1,
                        "stockQuantity": 1,
                        "warProductsId": 1,
                        "warWarehousesId": 1
                    },
                    {
                        "brandId": 1,
                        "discount": 0,
                        "quantity": 6,
                        "price": 3.5,
                        "productType": 1,
                        "stockQuantity": 1,
                        "warProductsId": 1,
                        "warWarehousesId": 1
                    }
                ]
            },
            {
                "id": 3,
                "amount": 52,
                "amountCash": 0,
                "amountCredit": 52,
                "creditCardName": "MASTERCARD",
                "subtotal": 50,
                "taxes": 2,
                "currency": "PEN",
                "commentary": null,
                "discount": 0,
                "exchangeAmount": 3.29,
                "number": "3",
                "serie": "002",
                "comEmployeeId": 1,
                "customerId": null,
                "customer": null,
                "employee":
                {
                    "id": 1,
                    "code": null,
                    "roleId": 1,
                    "appId": 1,
                    "housekeepingScore": null,
                    "comSubsidiariesId": 1,
                    "comMsStateEmpId": 1,
                    "warWarehousesId": 1,
                    "salTerminalsId": 1,
                    "name": "Japi",
                    "lastname": "Sale",
                    "nationality": null,
                    "email": "japi@mail.com",
                    "phone": null,
                    "gender": null,
                    "dateBirth": null,
                    "civilStatus": null,
                    "sonNumber": null,
                    "group": null,
                    "dateHealing": null,
                    "languages": null,
                    "subsidiaries": null,
                    "urlImage": null,
                    "tokenDevice": null,
                    "flagAdmin": null
                },
                "details":
                [
                    {
                        "brandId": 1,
                        "discount": 0,
                        "quantity": 10,
                        "price": 20,
                        "productType": 1,
                        "stockQuantity": 1,
                        "warProductsId": 1,
                        "warWarehousesId": 1
                    },
                    {
                        "brandId": 1,
                        "discount": 0,
                        "quantity": 6,
                        "price": 3.5,
                        "productType": 1,
                        "stockQuantity": 1,
                        "warProductsId": 1,
                        "warWarehousesId": 1
                    }
                ]
            }
        ]

## Sales document Collection [/sale-documents/FAC/type-document]

### Create a New Sales document [POST]

You can create your own sales document using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "amount": 260.78,
            "commentary": "Una venta de prueba",
            "currency": "PEN",
            "customerId": 1,
            "discount": 0,
            "exchangeAmount": 3.25,
            "salTypePaymentId": 1,
            "subtotal": 221,
            "taxes": 39.78,
            "details":
            [
                {
                    "brandId": 1,
                    "discount": 0,
                    "quantity": 10,
                    "price": 20,
                    "productType": 1,
                    "stockQuantity": 1,
                    "warProductsId": 1,
                    "warWarehousesId": 1
                },
                {
                    "brandId": 1,
                    "discount": 0,
                    "quantity": 6,
                    "price": 3.5,
                    "productType": 1,
                    "stockQuantity": 1,
                    "warProductsId": 1,
                    "warWarehousesId": 1
                }
            ],
            "amountCash": 260.78
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "amount": 260.78,
              "commentary": "Una venta de prueba",
              "currency": "PEN",
              "customerId": 1,
              "discount": 0,
              "exchangeAmount": 3.25,
              "salTypePaymentId": 1,
              "subtotal": 221,
              "taxes": 39.78,
              "details":
              [
                  {
                      "brandId": 1,
                      "discount": 0,
                      "quantity": 10,
                      "price": 20,
                      "stockQuantity": 1,
                      "warProductsId": 1,
                      "warWarehousesId": 1,
                      "salSaleDocumentsId": 127,
                      "deletedAt": null,
                      "flagActive": true,
                      "createdAt": "2018-01-04 13:02:51",
                      "updatedAt": "2018-01-04 13:02:51",
                      "id": 240
                  },
                  {
                      "brandId": 1,
                      "discount": 0,
                      "quantity": 6,
                      "price": 3.5,
                      "stockQuantity": 1,
                      "warProductsId": 1,
                      "warWarehousesId": 1,
                      "salSaleDocumentsId": 127,
                      "deletedAt": null,
                      "flagActive": true,
                      "createdAt": "2018-01-04 13:02:51",
                      "updatedAt": "2018-01-04 13:02:51",
                      "id": 241
                  }
              ],
              "amountCash": 260.78,
              "serie": "002",
              "number": "7",
              "serieId": 2,
              "terminalId": 1,
              "salTypeDocumentId": 2,
              "comCompanyId": 1,
              "userId": 1,
              "comEmployeeId": 1,
              "salStatesId": 3,
              "comSubsidiaryId": 1,
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-04 13:02:50",
              "updatedAt": "2018-01-04 13:02:50",
              "id": 127
          }

## Sales document Collection [/sale-documents/{saleDocumentId}]

### List details sales document [GET]

- Response 200 (application/json)

        {
            "id": 127,
            "amount": 260.78,
            "amountCash": 260.78,
            "amountCredit": null,
            "creditCardName": null,
            "subtotal": 221,
            "taxes": 39.78,
            "currency": "PEN",
            "commentary": "Una venta de prueba",
            "discount": 0,
            "exchangeAmount": 3.25,
            "number": "7",
            "serie": "002",
            "comEmployeeId": 1,
            "customerId": 1,
            "customer":
            {
                "id": 1,
                "dni": "44132287",
                "ruc": null,
                "email": "japi@mail.com",
                "flagTypePerson": 1,
                "comCompaniesId": 1,
                "flagActive": 1,
                "address": null,
                "contact": null,
                "name": "Japi",
                "lastname": "Sale",
                "rzSocial": null
            },
            "employee":
            {
                "id": 1,
                "code": null,
                "roleId": 1,
                "appId": 1,
                "housekeepingScore": null,
                "comSubsidiariesId": 1,
                "comMsStateEmpId": 1,
                "warWarehousesId": 1,
                "salTerminalsId": 1,
                "name": "Japi",
                "lastname": "Sale",
                "nationality": null,
                "email": "japi@mail.com",
                "phone": null,
                "gender": null,
                "dateBirth": null,
                "civilStatus": null,
                "sonNumber": null,
                "group": null,
                "dateHealing": null,
                "languages": null,
                "subsidiaries": null,
                "urlImage": null,
                "tokenDevice": null,
                "flagAdmin": null
            },
            "details":
            [
                {
                    "id": 240,
                    "price": 20,
                    "quantity": 10,
                    "discount": 0,
                    "warProductsId": 1,
                    "salSaleDocumentsId": 127
                },
                {
                    "id": 241,
                    "price": 3.5,
                    "quantity": 6,
                    "discount": 0,
                    "warProductsId": 1,
                    "salSaleDocumentsId": 127
                }
            ]
        }

## Sales document Collection [/sale-documents/new-sale-documents/{saleDocumentId}]

### Create a new sales document from a sales note [POST]

You can create your own sales document using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "amount": 260.78,
            "amountCash": 260.78,
            "amountCredit": 100.0,
            "creditCardName": "VISA",
            "currency": "PEN",
            "customerId": 1,
            "salTypeDocumentId": 1,
            "salTypePaymentId": 1,
            "subtotal": 221,
            "taxes": 39.78,
            "details":
            [
                {
                    "brandId": 1,
                    "discount": 0,
                    "quantity": 10,
                    "price": 20,
                    "productType": 1,
                    "stockQuantity": 1,
                    "warProductsId": 1,
                    "warWarehousesId": 1
                },
                {
                    "brandId": 1,
                    "discount": 0,
                    "quantity": 6,
                    "price": 3.5,
                    "productType": 1,
                    "stockQuantity": 1,
                    "warProductsId": 1,
                    "warWarehousesId": 1
                }
            ]
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "amount": 260.78,
              "commentary": "Una venta de prueba",
              "currency": "PEN",
              "customerId": 1,
              "discount": 0,
              "exchangeAmount": 3.25,
              "salTypePaymentId": 1,
              "subtotal": 221,
              "taxes": 39.78,
              "details":
              [
                  {
                      "brandId": 1,
                      "discount": 0,
                      "quantity": 10,
                      "price": 20,
                      "stockQuantity": 1,
                      "warProductsId": 1,
                      "warWarehousesId": 1,
                      "salSaleDocumentsId": 127,
                      "deletedAt": null,
                      "flagActive": true,
                      "createdAt": "2018-01-04 13:02:51",
                      "updatedAt": "2018-01-04 13:02:51",
                      "id": 240
                  },
                  {
                      "brandId": 1,
                      "discount": 0,
                      "quantity": 6,
                      "price": 3.5,
                      "stockQuantity": 1,
                      "warProductsId": 1,
                      "warWarehousesId": 1,
                      "salSaleDocumentsId": 127,
                      "deletedAt": null,
                      "flagActive": true,
                      "createdAt": "2018-01-04 13:02:51",
                      "updatedAt": "2018-01-04 13:02:51",
                      "id": 241
                  }
              ],
              "amountCash": 260.78,
              "serie": "002",
              "number": "7",
              "serieId": 2,
              "terminalId": 1,
              "salTypeDocumentId": 2,
              "comCompanyId": 1,
              "userId": 1,
              "comEmployeeId": 1,
              "salStatesId": 3,
              "comSubsidiaryId": 1,
              salDocumentsId: 127,
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-04 13:02:50",
              "updatedAt": "2018-01-04 13:02:50",
              "id": 129
          }

## Sales document Collection [/sale-documents/amount]

### Amount total day sales document [GET]

- Response 200 (application/json)

            [
                {
                    "sumAmount": 521.56
                }
            ]

##Sales document Collection [/sale-documents/sale-expense/1?startDate=2018-01-11&endDate=2018-01-11]

### grouped list of sales-expenses by parameter "{typeQuery}" [GET]

This service returns the total amount and quantity of sales and expenses grouped by
type of document and type of expenses

- Response 200 (application/json)

        [
            { "code": "BOL", "total": 31.7, "quantity": 2 },
            { "code": "FAC", "total": 32.7, "quantity": 2 }
            { "code": "lz", "total": 31.7, "quantity": 2 },
            { "code": "pr", "total": 32.7, "quantity": 2 }
        ]

##Sales document Collection [/sale-documents/sale-expense/2?startDate=2018-01-11&endDate=2018-01-11]

### grouped list of sales-expenses by parameter "{typeQuery}" [GET]

This service returns the total amount and quantity of sales grouped by
type of payment

- Response 200 (application/json)

        [
            { "name": "efectivo", "total": 31.7, "quantity": 2 },
            { "name": "visa", "total": 32.7, "quantity": 2 }
        ]

##Sales document Collection [/sale-documents/sale-expense/3?startDate=2018-01-11&endDate=2018-01-11]

### grouped list of sales-expenses by parameter "{typeQuery}" [GET]

This service returns the total amount and quantity of expenses grouped by
type of expenses

- Response 200 (application/json)

        [
            { "code": "lz", "total": 31.7, "quantity": 2 },
            { "code": "pr", "total": 32.7, "quantity": 2 }
        ]

## Companies Collection [/companies]

### Create a new Companies [POST]

You can create your own companies using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "comItemId": 1,
            "companyName": "COMPANY DEMO",
            "companyRzSocial": "COMPANY SAC",
            "email": "company@email.com",
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "comItemId": 1,
              "companyName": "COMPANY DEMO",
              "companyRzSocial": "COMPANY SAC",
              "email": "company@email.com",
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-09 11:37:51",
              "updatedAt": "2018-01-09 11:37:51",
              "id": 4,
              "comCompanyId": 4,
              "customer": 7,
              "subsidiaries": 6,
              "employee": 6
          }

## Cash-desk-closing Collection [/cash-desk-closing]

### Create a new Cash-desk-closing [POST]

You can create your own Cash-desk-closing using this action. A JSON is needed
object that contains a list of required fields.
This service also updates the sales and expenses, relating them to the new cash-desk-closing.

- Request (application/json)

        {
            "employeeId": 1,
            "closedAt": "2018-01-09 11:37:51",
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "employeeId": 1,
              "closedAt": "2018-01-12T21:49:06.259Z",
              "companyId": 101,
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-12 16:49:06",
              "updatedAt": "2018-01-12 16:49:06",
              "id": 5
          }

## Exchange-Rates Collection [/exchange-rates]

### Create or update a Exchange-Rates [POST]

You can create your own exchange rates using this action. A JSON is needed
object that contains a list of required fields. In case an exchange rate has
already been registered in the day, only the amount will be updated and the
service will return 1

- Request (application/json)

        {
            "amount": 3.4,
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "amount": 3.4,
              "companyId": 101,
              "default": 0,
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-16 17:54:33",
              "updatedAt": "2018-01-16 17:54:33",
              "id": 32
          }

### List All Exchange-Rates [GET]

- Response 200 (application/json)

  [
  { "id": 1, "companyId": 101, "amount": 3.2, "default": 0 },
  { "id": 2, "companyId": 101, "amount": 3.5, "default": 0 },
  { "id": 3, "companyId": 101, "amount": 3.6, "default": 0 },
  { "id": 4, "companyId": 101, "amount": 3.7, "default": 0 },
  { "id": 32, "companyId": 101, "amount": 3.7, "default": 0 }
  ]

## Exchange-Rates Collection [/exchange-rates/{today}]

"today" is a date

### List details sales document [GET]

- Response 200 (application/json)

            {
                "id": 32,
                "companyId": 101,
                "amount": 3.7,
                "default": 0
            }

## Remission-guides Collection [/remission-guides]

### Create a remission-guides [POST]

You can create your own remission-guides using this action. A JSON is needed
object that contains a list of required fields

- Request (application/json)

        {
            "salSaleDocumentsId": 1,
            "number": "1",
            "transportData": {},
            "driverCelphone": "34508752",
            "destination": "destination",
            "driverName": "driver name",
            "driverLicensePlate": "driverlicense",
            "driverLicense": "driverlicense",
            "observation": "observation",
            "details":
            [
                {
                    "id": 1,
                    "warProductsId": 990184,
                    "quantity": 2,
                    "warehousesId": 109,
                    "brandId": 1761
                }
            ]
        }

- Response 201 (application/json)

  - Headers

          Location: /questions/2
          Authorization: Bearer a_json_token

  - Body

          {
              "salSaleDocumentsId": 1,
              "number": "1",
              "transportData": {},
              "driverCelphone": "34508752",
              "destination": "destination",
              "driverName": "driver name",
              "driverLicensePlate": "driverlicense",
              "driverLicense": "driverlicense",
              "observation": "observation",
              "details":
              [
                  {
                      "id": 1,
                      "salSaleDocumentsDetailId": 1,
                      "salRemissionGuideId": 1,
                      "warProductId": 990184,
                      "quantity": 2,
                      "warWarehousesId": 109,
                      "brandId": 1761,
                      "flagActive": 1,
                      "deletedAt": null,
                      "createdAt": "2018-01-19T20:45:11.000Z",
                      "updatedAt": "2018-01-19T20:45:11.000Z"
                  }
              ],
              "companyId": 101,
              "employeeId": 1,
              "deletedAt": null,
              "flagActive": true,
              "createdAt": "2018-01-19 15:45:11",
              "updatedAt": "2018-01-19 15:45:11",
              "id": 1
          }

### List All remission-guides [GET]

- Response 200 (application/json)

  [

                {
                    "id": 1,
                    "salSaleDocumentsId": 1,
                    "number": "1",
                    "employeeId": 1,
                    "transportData": {},
                    "driverCelphone": "34508752",
                    "destination": "destination",
                    "driverName": "driver name",
                    "driverLicensePlate": "driverlicense",
                    "driverLicense": "driverlicense",
                    "observation": "observation",
                    "details": [
                        {
                            "salSaleDocumentsDetailId": 1,
                            "warProductId": 990184,
                            "quantity": 2,
                            "warWarehousesId": 109,
                            "brandId": 1761,
                            "salRemissionGuideId": 1,
                            "deletedAt": null,
                            "flagActive": true,
                            "createdAt": "2018-01-19 15:45:11",
                            "updatedAt": "2018-01-19 15:45:11",
                            "id": 1
                        }
                    ]
                }
            ]

## Remission-guides Collection [/remission-guides/{id}]

### List details remission-guides [GET]

- Response 200 (application/json)

            {
                "id": 1,
                "salSaleDocumentsId": 1,
                "number": "1",
                "employeeId": 1,
                "transportData": {},
                "driverCelphone": "34508752",
                "destination": "destination",
                "driverName": "driver name",
                "driverLicensePlate": "driverlicense",
                "driverLicense": "driverlicense",
                "observation": "observation",
                "details":
                [
                    {
                        "id": 1,
                        "salSaleDocumentsDetailId": 1,
                        "salRemissionGuideId": 1,
                        "warProductId": 990184,
                        "quantity": 2,
                        "warWarehousesId": 109,
                        "brandId": 1761,
                        "flagActive": 1,
                        "deletedAt": null,
                        "createdAt": "2018-01-19T20:45:11.000Z",
                        "updatedAt": "2018-01-19T20:45:11.000Z"
                    }
                ]
            }

## Sale-document Amortization [/sale-documents/amortization/{customerId}]

### List details sale-documents by customer [GET]

- Response 200 (application/json)

        [
            {
                "id": 163,
                "amount": 260.78,
                "amountCash": 260.78,
                "amountCredit": 100,
                "creditCardName": "VISA",
                "dueAmount": 0,
                "subtotal": 221,
                "taxes": 39.78,
                "currency": "PEN",
                "commentary": "Una venta de prueba",
                "discount": 0,
                "exchangeRate": null,
                "exchangeAmount": 80.24,
                "number": "2",
                "serie": "001",
                "comEmployeeId": 1,
                "customerId": 1,
                "createdAt": "2018-03-13",
                "salStatesId": 4,
                "salTypeDocumentId": 1,
                "paymentMethodId": 1,
                "ticketNumber": null,
                "expiratedAt": null,
                "change": null,
                "customer": {
                    "id": 1,
                    "dni": "44132287",
                    "ruc": null,
                    "email": "japi@mail.com",
                    "phone": null,
                    "flagTypePerson": 1,
                    "comCompaniesId": 101,
                    "flagActive": 1,
                    "address": null,
                    "contact": null,
                    "name": "Japi",
                    "lastname": "Sale",
                    "userId": 1,
                    "rzSocial": null,
                    "additionalInformation": null,
                    "prospect": null,
                    "customerItemId": null
                },
                "payment": {
                    "id": 1,
                    "name": "CONTADO",
                    "code": "CONTADO",
                    "description": "Pagos al contado"
                },
                "state": {
                    "id": 4,
                    "name": "FINALIZADO",
                    "code": "FIN",
                    "descriptions": "Documento de venta finalizado"
                },
                "typeDocument": {
                    "id": 1,
                    "name": "BOLETA",
                    "code": "BOL",
                    "description": "Descripción de Boleta"
                },
                "details": [
                  {
                    "brandId": 1761,
                    "discount": 0,
                    "id": 342,
                    "importQuantity": null,
                    "price": 20,
                    "quantity": 10,
                    "salSaleDocumentsId": 173,
                    "stockQuantity": 1,
                    "warProductsId": 990184,
                    "warWarehousesId": 109
                  },
                  {
                    "brandId": 1761,
                    "discount": 0,
                    "id": 343,
                    "importQuantity": null,
                    "price": 3.5,
                    "quantity": 6,
                    "salSaleDocumentsId": 173,
                    "stockQuantity": 1,
                    "warProductsId": 990185,
                    "warWarehousesId": 109
                  }
                ],
                "employee": {
                    "id": 1,
                    "aclUserId": 147,
                    "comSubsidiariesId": 1,
                    "warWarehousesId": 1,
                    "salTerminalsId": 1,
                    "name": "Japi",
                    "lastname": "Sale",
                    "email": "japi@mail.com",
                    "urlImage": null,
                    "flagAdmin": null,
                    "aclUserCode": null
                }
            }
        ]

## Sale-document Amortization details [/sale-documents/amortization-all?customerId=]

### List details sale-documents by customer [GET]

- Response 200 (application/json)

        [
            {
                "id": 163,
                "amount": 260.78,
                "amountCash": 260.78,
                "amountCredit": 100,
                "creditCardName": "VISA",
                "dueAmount": 0,
                "subtotal": 221,
                "taxes": 39.78,
                "currency": "PEN",
                "commentary": "Una venta de prueba",
                "discount": 0,
                "exchangeRate": null,
                "exchangeAmount": 80.24,
                "number": "2",
                "serie": "001",
                "comEmployeeId": 1,
                "customerId": 1,
                "createdAt": "2018-03-13",
                "salStatesId": 4,
                "salTypeDocumentId": 1,
                "paymentMethodId": 1,
                "ticketNumber": null,
                "expiratedAt": null,
                "change": null,
                "customer": {
                    "id": 1,
                    "dni": "44132287",
                    "ruc": null,
                    "email": "japi@mail.com",
                    "phone": null,
                    "flagTypePerson": 1,
                    "comCompaniesId": 101,
                    "flagActive": 1,
                    "address": null,
                    "contact": null,
                    "name": "Japi",
                    "lastname": "Sale",
                    "userId": 1,
                    "rzSocial": null,
                    "additionalInformation": null,
                    "prospect": null,
                    "customerItemId": null
                },
                "payment": {
                    "id": 1,
                    "name": "CONTADO",
                    "code": "CONTADO",
                    "description": "Pagos al contado"
                },
                "state": {
                    "id": 4,
                    "name": "FINALIZADO",
                    "code": "FIN",
                    "descriptions": "Documento de venta finalizado"
                },
                "typeDocument": {
                    "id": 1,
                    "name": "BOLETA",
                    "code": "BOL",
                    "description": "Descripción de Boleta"
                },
                "details": [
                  {
                    "brandId": 1761,
                    "discount": 0,
                    "id": 342,
                    "importQuantity": null,
                    "price": 20,
                    "quantity": 10,
                    "salSaleDocumentsId": 173,
                    "stockQuantity": 1,
                    "warProductsId": 990184,
                    "warWarehousesId": 109
                  },
                  {
                    "brandId": 1761,
                    "discount": 0,
                    "id": 343,
                    "importQuantity": null,
                    "price": 3.5,
                    "quantity": 6,
                    "salSaleDocumentsId": 173,
                    "stockQuantity": 1,
                    "warProductsId": 990185,
                    "warWarehousesId": 109
                  }
                ],
                "employee": {
                    "id": 1,
                    "aclUserId": 147,
                    "comSubsidiariesId": 1,
                    "warWarehousesId": 1,
                    "salTerminalsId": 1,
                    "name": "Japi",
                    "lastname": "Sale",
                    "email": "japi@mail.com",
                    "urlImage": null,
                    "flagAdmin": null,
                    "aclUserCode": null
                },
                "caDocument": {
                    "id": 1,
                    "amount": 100,
                    "documentId": 1,
                    "employeeId": 147,
                    "userId": 147,
                    "expirationDate": "2018-03-13",
                    "type": 1,
                    "details": [
                      {
                        "id": 1,
                        "ccDocumentId": 1,
                        "amount": 100,
                        "amountPayment": 100,
                        "expirationDate": "2018-03-13",
                        "typePaymentId": 1,
                        "status": 2,
                        "createdAt": "2018-03-14"
                      },
                      {
                        "id": 2,
                        "ccDocumentId": 1,
                        "amount": 168,
                        "amountPayment": 168,
                        "expirationDate": "2018-03-13",
                        "typePaymentId": 2,
                        "status": 2,
                        "createdAt": "2018-03-14"
                      }
                    ]
                }
            }
        ]

## Ca-document Amortization [/ca-documents/details]

### List details sale-documents by sale-documents [POST]

- Request (application/json)

        [ 1, 2 ]

- Response 200 (application/json)

        [
            {
                "id": 1,
                "amount": 100,
                "documentId": 1,
                "employeeId": 147,
                "userId": 147,
                "expirationDate": "2018-03-13",
                "type": 1,
                "details": [
                  {
                    "id": 1,
                    "ccDocumentId": 1,
                    "amount": 100,
                    "amountPayment": 100,
                    "expirationDate": "2018-03-13",
                    "typePaymentId": 1,
                    "status": 2,
                    "createdAt": "2018-03-14"
                  },
                  {
                    "id": 2,
                    "ccDocumentId": 1,
                    "amount": 168,
                    "amountPayment": 168,
                    "expirationDate": "2018-03-13",
                    "typePaymentId": 2,
                    "status": 2,
                    "createdAt": "2018-03-14"
                  }
                ]
            },
            {
                "id": 35,
                "amount": 20,
                "documentId": 2,
                "employeeId": 1,
                "userId": 1,
                "expirationDate": "2018-03-13",
                "type": 1,
                "details": [
                    {
                    "id": 1,
                    "ccDocumentId": 1,
                    "amount": 100,
                    "amountPayment": 100,
                    "expirationDate": "2018-03-13",
                    "typePaymentId": 1,
                    "status": 2,
                    "createdAt": "2018-03-14"
                  }
                ]
            }
        ]

## Create Amortizations [/amortizations-multiple/{paymentMethodId}/{salTypePaymentId}]

### List details sale-documents by sale-documents [POST]

- Request (application/json)

        {
            "bankAccountId": 1,
            "description": "MI TEST DE AMORTIZACION",
            "currency": "PEN",
            "documents": [
                {
                "caDocumentId": 2,
                "salDocumentId": 2,
                "amount": 90,
                "payments": [
                    {
                    "id": 3,
                    "amount": 30,
                    "amountPayment": 10,
                    "observations": "DETALLE CUOTA 1 DOC 2",
                    "expirationDate": "2018-03-14"
                    },
                    {
                    "id": 4,
                    "amount": 30,
                    "amountPayment": 10,
                    "observations": "DETALLE CUOTA 2 DOC 2",
                    "expirationDate": "2018-03-14"
                    },
                    {
                    "id": 5,
                    "amount": 30,
                    "amountPayment": 10,
                    "observations": "DETALLE CUOTA 3 DOC 2",
                    "expirationDate": "2018-03-14"
                    }
                ]
                },
                {
                "caDocumentId": 3,
                "salDocumentId": 3,
                "amount": 52,
                "payments": [
                    {
                    "id": 6,
                    "amount": 30,
                    "amountPayment": 30,
                    "observations": "DETALLE CUOTA 1 DOC 3",
                    "expirationDate": "2018-03-14"
                    },
                    {
                    "id": 7,
                    "amount": 22,
                    "amountPayment": 22,
                    "observations": "DETALLE CUOTA 2 DOC 3",
                    "expirationDate": "2018-03-14"
                    }
                ]
                }
            ]
        }

- Response 200 (application/json)

        [
            {
            "amount": 10,
            "bankAccountId": 1,
            "caDocumentId": 2,
            "employeeId": 1,
            "observations": "MI TEST DE AMORTIZACION",
            "paymentDate": "2018-03-14",
            "salDocumentId": 2,
            "typePaymentId": 1,
            "caDocumentDetailId": 3,
            "companyId": 101,
            "deletedAt": null,
            "flagActive": true,
            "createdAt": "2018-03-14 18:16:07",
            "updatedAt": "2018-03-14 18:16:07",
            "id": 63
            },
            {
            "amount": 10,
            "bankAccountId": 1,
            "caDocumentId": 2,
            "employeeId": 1,
            "observations": "MI TEST DE AMORTIZACION",
            "paymentDate": "2018-03-14",
            "salDocumentId": 2,
            "typePaymentId": 1,
            "caDocumentDetailId": 4,
            "companyId": 101,
            "deletedAt": null,
            "flagActive": true,
            "createdAt": "2018-03-14 18:16:07",
            "updatedAt": "2018-03-14 18:16:07",
            "id": 64
            },
            {
            "amount": 10,
            "bankAccountId": 1,
            "caDocumentId": 2,
            "employeeId": 1,
            "observations": "MI TEST DE AMORTIZACION",
            "paymentDate": "2018-03-14",
            "salDocumentId": 2,
            "typePaymentId": 1,
            "caDocumentDetailId": 5,
            "companyId": 101,
            "deletedAt": null,
            "flagActive": true,
            "createdAt": "2018-03-14 18:16:07",
            "updatedAt": "2018-03-14 18:16:07",
            "id": 65
            },
            {
            "amount": 30,
            "bankAccountId": 1,
            "caDocumentId": 3,
            "employeeId": 1,
            "observations": "MI TEST DE AMORTIZACION",
            "paymentDate": "2018-03-14",
            "salDocumentId": 3,
            "typePaymentId": 1,
            "caDocumentDetailId": 6,
            "companyId": 101,
            "deletedAt": null,
            "flagActive": true,
            "createdAt": "2018-03-14 18:16:07",
            "updatedAt": "2018-03-14 18:16:07",
            "id": 66
            },
            {
            "amount": 22,
            "bankAccountId": 1,
            "caDocumentId": 3,
            "employeeId": 1,
            "observations": "MI TEST DE AMORTIZACION",
            "paymentDate": "2018-03-14",
            "salDocumentId": 3,
            "typePaymentId": 1,
            "caDocumentDetailId": 7,
            "companyId": 101,
            "deletedAt": null,
            "flagActive": true,
            "createdAt": "2018-03-14 18:16:07",
            "updatedAt": "2018-03-14 18:16:07",
            "id": 67
            }
        ]

## Save Service Postman

### Service Payroll

https://www.getpostman.com/collections/3fab2a9598c569f55555
