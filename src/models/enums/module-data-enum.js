'use strict';

const moduleData = {
	sales: { id: 1, code: 'VENTA', name: 'VENTAS' },
	purchases: { id: 2, code: 'COMPRA', name: 'COMPRAS' },
	debtsToPay: { id: 1, code: 'CTAXPAG', name: 'CUENTAS POR PAGAR' },
	accountsReceivable: { id: 4, code: 'CTAXCOB', name: 'CUENTAS POR COBRAR' },
	cash: { id: 5, code: 'CAJA', name: 'CAJA' },
	bank: { id: 6, code: 'BANCO', name: 'BANCO' },
	ecommerce: { id: 7, code: 'ECOMMERCE', name: 'PEDIDO ECOMMERCE' },
	inventory: { id: 8, name: 'INVENTARIO' },
	transfers: { id: 9, name: 'TRANSFERENCIA' },
};

module.exports = moduleData;
