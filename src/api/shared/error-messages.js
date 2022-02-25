'use strict';

const errorMessages = {
	CASH_CLOSING_USER_EXIST:
		'Caja aperturada con otro usuario/vendedor, por favor cierre caja para poder continuar el registro',
	DOCUMENT_CANCEL_CASH_INVALID: 'Usuario no autorizado para asignar caja en anulación de documento',
	CASHID_NOT_RELATED_TO_TERMINAL: 'La caja selecionada no corresponde con la asignada en el PTV',
	TERMINAL_OPENING_DIFFERS_ON_SALE: 'Terminal de apertura no correspondiente a la venta',
	HASH_ONLINE_SALES_DUPLICATE: 'La venta ya se ha registrado con éxito',
	CASH_DESK_CLOSING_NOT_FOUND: 'No hay apertura de PTV pendiente para transferir o cerrar',
	SERIE_DOCUMENT_SUPPLIER_REPEATED_ERROR:
		'El número de serie y el documento fueron registrados previamente.',
	DELIVERY_NOT_CORRESPOND_ORDERS: 'El repartidor no coincide con el conjunto de pedidos.',
	COMMERCE_NOT_CORRESPOND_ORDERS: 'El comercio no coincide con el conjunto de pedidos.',
	ORDER_HAS_COMMERCE_LIQUIDATION: 'Commercio ya cuenta con una orden de liquidacion.',
	LIQUIDATIONS_NOT_FOUND: 'Liquidacion no encontrada.',
	ORDER_HAS_DELIVERY_LIQUIDATION:
		'El Repartidor ya cuenta con una orden de liquidacion sobre el pedido.',
	SERIE_EXIST:
		'La serie del documento ya ha sido asignada previamente, modifíquela y vuelva a intentarlo',
	SERIE_NOT_CORRESPOND_DOCUMENT_TYPE:
		'La serie no se corresponde con el tipo de documento indicado, póngase en contacto con el administrador del sistema.',
	PRODUCT_WITHOUT_PURCHASE: 'Producto no tiene compras registradas.',
	TERMINAL_DISABLED_SALE_ERROR:
		'El terminal seleccionado está desactivada, seleccione otra y vuelva a intentarlo.',
	ORDER_RELATED_TO_ANNEX:
		'Una o más de los pedidos estan relacionadas con otro archivo. Revíselo y vuelva a intentarlo.',
	GROUP_NOT_EXIST: 'No se encontró el grupo de clientes, compruébelo e inténtelo de nuevo.',
	STOCK_NO_AVAILABLE: 'Los productos seleccionados no cubren el stock disponible actual.',
	LIMIT_ASSIGNED_ORDERS_CURIER_ERROR:
		'Se superó el límite de pedidos tipo Courier que se pueden asignar al usuario.',
	LIMIT_ASSIGNED_ORDERS_DELIVERY_ERROR:
		'Se superó el límite de pedidos tipo Delivery que se pueden asignar al usuario.',
	LIMIT_ASSIGNED_ORDERS_FREE_COURIER_ERROR:
		'Se superó el límite de pedidos tipo Libre que se pueden asignar al usuario.',
	PURCHASE_CANNOT_DELETE_ERROR:
		'No se pudo realizar realizar accion, por favor verifique y vuelva a intentarlo',
	ORDER_GENERATED_SALE_ERROR:
		'El pedido que está intentando convertir se generó previamente como una venta.',
	SALE_NTC_TYPE_ERROR:
		'Error al generar el documento de nota de crédito (monto, cantidad) los artículos fueron devueltos, verifique la información o comuníquese con el soporte para una revisión.',
	SALE_NDD_TYPE_ERROR:
		'Error al generar el documento de devolucion de nota de venta (monto, cantidad) los artículos fueron devueltos, verifique la información o comuníquese con el soporte para una revisión.',
	HAS_BEEN_RETURNED_IN_FULL:
		'No se puede devolver el producto porque la cantidad/monto excede lo permitido, verifique e intente nuevamente.',
	CATALOG_SUNAT_NOT_EXIST:
		'Configuracion de tipo de documento no configurado, verifique la información o comuníquese con el soporte para una revisión.',
	SALE_FLAG_USE_INVALID: 'El documento fue utilizado en su totalidad.',
};

module.exports = errorMessages;
