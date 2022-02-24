'use strict';

const CompanyReport = require('../models/CompanyReport');
const Aws = require('./Aws');

async function awsUploadFile(sale, templateCode) {
	try {
		if (sale.dataResponseTaxes && sale.dataResponseTaxes.documentUrl) {
			return {};
		}
		const report = await CompanyReport.getByIdOrCode(sale.comCompanyId, templateCode);
		const saleWithProducts = { ...sale };
		saleWithProducts.detailsByCategory = [];
		let sumProducts = 0;
		saleWithProducts.details.forEach((detail) => {
			sumProducts += detail.quantity;
			const newDetail = Object.assign({}, detail);
			const { categoryId } = newDetail;
			const cc = saleWithProducts.detailsByCategory.findIndex(c => c.id === categoryId);
			if (cc === -1) {
				saleWithProducts.detailsByCategory.push({
					id: newDetail.categoryId,
					name: newDetail.categoryName,
					products: [newDetail],
				});
			} else {
				saleWithProducts.detailsByCategory[cc].products.push(newDetail);
			}
		});
		saleWithProducts.totalQuantity = sumProducts;
		saleWithProducts.detailsByCategory = saleWithProducts.detailsByCategory.map((detail) => {
			const nd = Object.assign({}, detail);
			/* eslint-disable no-mixed-operators */
			nd.quantity = nd.products.reduce((acum, p) => acum + p.quantity, 0);
			nd.total = nd.products.reduce((acum, p) => acum + (p.quantity * p.price - p.discount), 0);
			return nd;
		});

		const file = await CompanyReport.generateReport(report, saleWithProducts);
		const fileName = `${saleWithProducts.comCompanyId}${saleWithProducts.id}${
			saleWithProducts.documentNumber
		}.pdf`;
		const archive = await Aws(file, fileName, process.env.AWS_S3_BUCKET);
		return archive ? { documentUrl: archive.Location } : {};
	} catch (error) {
		return error;
	}
}

module.exports = awsUploadFile;
