import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError  } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ExpressFee } from '../common/ExpressFee';

@Injectable({
  providedIn: 'root'
})
export class ProvinceService {

  // provinces = 'https://provinces.open-api.vn/api/p'
  provinces = "https://online-gateway.ghn.vn/shiip/public-api/master-data/province"
  // districts = 'https://provinces.open-api.vn/api/p';
  districts = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district"
  // wards = 'https://provinces.open-api.vn/api/d';
  wards = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward"
  express = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services";
  fee = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee";

  newFee = "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create";
  cancelOrderAPI = "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/switch-status/cancel";

  // province = 'https://provinces.open-api.vn/api/p/';
  // district = 'https://provinces.open-api.vn/api/d/';  
  // ward = 'https://provinces.open-api.vn/api/w/';

  constructor(private http: HttpClient) { }

  getAllProvinces(): Observable<any> {
    // return this.http.get(this.provinces);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '9ac7d78e-ab11-11ee-893f-b6ed573185af'
    });

    return this.http.get(this.provinces, { headers });
  }

  getDistricts(code:number) : Observable<any> {
    // return this.http.get(this.districts+'/'+code+'?depth=2');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '9ac7d78e-ab11-11ee-893f-b6ed573185af'
    });

    const params = new HttpParams().set('province_id', code);

    return this.http.get(this.districts, { headers, params });
  }

  getWards(code:number) : Observable<any> {
    // return this.http.get(this.wards+'/'+code+'?depth=2');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '9ac7d78e-ab11-11ee-893f-b6ed573185af'
    });

    const params = new HttpParams().set('district_id', code);

    return this.http.get(this.wards, { headers, params });
  }

  cancelOrder(orderCode: string[]) {

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '6f301080-ab8b-11ee-a6e6-e60958111f48',
      'shop_id': '190735'
    });

    const data = {
      'order_codes': orderCode 
    };

    return this.http.post(this.cancelOrderAPI, data, { headers })
  }

  getExpressFee(expressChoiceCode: number, shopDistrictCode: number, wardCode: number, districtCode: number, amount: number) : Observable<any> {
    // return this.http.get(this.wards+'/'+code+'?depth=2');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '6f301080-ab8b-11ee-a6e6-e60958111f48',
      'shop_id': '190735'
    });

      const data = {
        "payment_type_id": 2,
        "required_note": "KHONGCHOXEMHANG",
        "from_name": "Chủ Shop Giang's Ecommerce",
        "from_phone": "0979022704",
        "from_address": "29 Đỗ Xuân Hợp, P. Phước Long B, TP Thủ Đức, Hồ Chí Minh",
        "from_ward_name": "P. Phước Long B",
        "from_district_name": "TP Thủ Đức",
        "from_province_name": "HCM",
        "to_name": "Khách hàng Giang Lê",
        "to_phone": "0979022704",
        "to_address": "Thôn Vạn Trung, Xã Phổ Phong, Huyện Đức Phổ, Quảng Ngãi",
        "to_ward_code": `${wardCode}`,
        "to_district_id": Number(districtCode),
        "cod_amount": 10000,
        "weight": 200,
        "length": 1,
        "width": 19,
        "height": 10,
        "service_type_id": Number(expressChoiceCode), // Thay service_id bằng service_type_id
        "items": [
          {
            "name": "Sản phẩm Điện thoại testing",
            "quantity": 100,
            "weight": 1200
          }
        ]
      };

    return this.http.post(this.newFee, data, { headers })
  }

  getExpress(districtCode: number, shopDistrictCode: number, shopId: number) : Observable<any> {
    // return this.http.get(this.wards+'/'+code+'?depth=2');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '9ac7d78e-ab11-11ee-893f-b6ed573185af'
    });

    const params = new HttpParams()
      .set('shop_id', shopId)
      .set('from_district', shopDistrictCode)
      .set('to_district', districtCode);


    return this.http.get(this.express, { headers, params });
  }

  // getProvince(id: number) {
  //   return this.http.get(this.province+id);
  // }

  // getDistrict(id: number) {
  //   return this.http.get(this.district+id);
  // }

  // getWard(id: number) {
  //   return this.http.get(this.ward+id);
  // }
}
