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

    // Gọi API với tiêu đề và dữ liệu JSON
    return this.http.get(this.provinces, { headers });
  }

  getDistricts(code:number) : Observable<any> {
    // return this.http.get(this.districts+'/'+code+'?depth=2');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '9ac7d78e-ab11-11ee-893f-b6ed573185af'
    });

    // Chuyển đổi dữ liệu JSON thành chuỗi query
    const params = new HttpParams().set('province_id', code);

    // Gọi API với tiêu đề và dữ liệu JSON
    return this.http.get(this.districts, { headers, params });
  }

  getWards(code:number) : Observable<any> {
    // return this.http.get(this.wards+'/'+code+'?depth=2');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '9ac7d78e-ab11-11ee-893f-b6ed573185af'
    });

    // Chuyển đổi dữ liệu JSON thành chuỗi query
    const params = new HttpParams().set('district_id', code);

    // Gọi API với tiêu đề và dữ liệu JSON
    return this.http.get(this.wards, { headers, params });
  }

  getExpressFee(expressChoiceCode: number, shopDistrictCode: number, wardCode: number, districtCode: number, amount: number) : Observable<any> {
    // return this.http.get(this.wards+'/'+code+'?depth=2');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '9ac7d78e-ab11-11ee-893f-b6ed573185af'
    });

    // Chuyển đổi dữ liệu JSON thành chuỗi query
    const params = new HttpParams()
      .set('service_id', expressChoiceCode)
      .set('insurance_value', amount)
      .set('coupon', "")
      .set('from_district_id', shopDistrictCode)
      .set('to_district_id', districtCode)
      .set('to_ward_code', wardCode)
      .set('height', 15)
      .set('length', 15)
      .set('weight', 1000)
      .set('width', 15);

    // Gọi API với tiêu đề và dữ liệu JSON
    return this.http.get(this.fee, { headers, params }).pipe(
      catchError((error) => {
        if (error.status === 400) {
          // Xử lý lỗi 400 ở đây (hoặc trả về thông báo lỗi)
          console.error('Bad Request:', error);
          const defaultFee: ExpressFee = {
            total: 0,
            service_fee: 0
          };
          return [defaultFee];
        }
        // Chuyển lỗi để Observable khác xử lý (nếu cần)
        return throwError(error);
      }));
  }

  getExpress(districtCode: number, shopDistrictCode: number, shopId: number) : Observable<any> {
    // return this.http.get(this.wards+'/'+code+'?depth=2');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'token': '9ac7d78e-ab11-11ee-893f-b6ed573185af'
    });

    // Chuyển đổi dữ liệu JSON thành chuỗi query
    const params = new HttpParams()
      .set('shop_id', shopId)
      .set('from_district', shopDistrictCode)
      .set('to_district', districtCode);


    // Gọi API với tiêu đề và dữ liệu JSON
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
