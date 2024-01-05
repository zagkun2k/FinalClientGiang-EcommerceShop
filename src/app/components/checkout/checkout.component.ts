import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { ICreateOrderRequest, IPayPalConfig } from 'ngx-paypal';
import { ToastrService } from 'ngx-toastr';
import { Cart } from 'src/app/common/Cart';
import { CartDetail } from 'src/app/common/CartDetail';
import { ChatMessage } from 'src/app/common/ChatMessage';
import { Customer } from 'src/app/common/Customer';
import { District } from 'src/app/common/District';
import { ExpressChoice } from 'src/app/common/ExpressChoice';
import { ExpressFee } from 'src/app/common/ExpressFee';
import { Notification } from 'src/app/common/Notification';
import { Order } from 'src/app/common/Order';
import { Province } from 'src/app/common/Province';
import { Ward } from 'src/app/common/Ward';
import { CartService } from 'src/app/services/cart.service';
import { NotificationService } from 'src/app/services/notification.service';
import { OrderService } from 'src/app/services/order.service';
import { ProvinceService } from 'src/app/services/province.service';
import { SessionService } from 'src/app/services/session.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  cart!: Cart;
  cartDetail!: CartDetail;
  cartDetails!: CartDetail[];

  discount!: number;
  amount!: number;
  amountReal!: number;

  postForm: FormGroup;

  provinces!: Province[];
  districts!: District[];
  wards!: Ward[];
  expressChoice!: ExpressChoice[];
  expressFee!: ExpressFee;
  expressChoiceCode!: number;
  finalTotal!: number;

  province!: Province;
  district!: District;
  ward!: Ward;

  warName!: string;
  districtName!: string;
  provinceName!: string;

  amountPaypal !:number;
  provinceCode!: number;
  districtCode!: number;
  wardCode!: number;
  shopDistrictCode!: number;
  shopId!: number;
  public payPalConfig ? : IPayPalConfig;

  constructor(
    private cartService: CartService,
    private toastr: ToastrService,
    private router: Router,
    private sessionService: SessionService,
    private orderService: OrderService,
    private location: ProvinceService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService) {
    this.postForm = new FormGroup({
      'phone': new FormControl(null, [Validators.required, Validators.pattern('(0)[0-9]{9}')]),
      'province': new FormControl(0, [Validators.required, Validators.min(1)]),
      'district': new FormControl(0, [Validators.required, Validators.min(1)]),
      'ward': new FormControl(0, [Validators.required, Validators.min(1)]),
      'express': new FormControl(0, [Validators.required, Validators.min(1)]),
      'number': new FormControl('', Validators.required),
    })
  }

  ngOnInit(): void {
    this.checkOutPaypal();
    this.webSocketService.openWebSocket();
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0)
    });
    this.shopDistrictCode = 3695;
    this.shopId = 1327893;
    this.finalTotal = 0;
    this.discount = 0;
    this.amount = 0;
    this.amountPaypal = 0;
    this.amountReal = 0;
    this.cart = new Cart(99)
    this.cart.user = new Customer(99);
    this.cart.user.name = "";
    this.getAllItem();
    this.getProvinces();
  }

  getAllItem() {
    let email = this.sessionService.getUser();
    this.cartService.getCart(email).subscribe(data => {
      this.cart = data as Cart;
      this.postForm = new FormGroup({
        'phone': new FormControl(this.cart.phone, [Validators.required, Validators.pattern('(0)[0-9]{9}')]),
        'province': new FormControl(0, [Validators.required, Validators.min(1)]),
        'district': new FormControl(0, [Validators.required, Validators.min(1)]),
        'ward': new FormControl(0, [Validators.required, Validators.min(1)]),
        'express': new FormControl(0, [Validators.required, Validators.min(1)]),
        'number': new FormControl('', Validators.required),
      })
      this.cartService.getAllDetail(this.cart.cartId).subscribe(data => {
        this.cartDetails = data as CartDetail[];
        this.cartService.setLength(this.cartDetails.length);
        if (this.cartDetails.length == 0) {
          this.router.navigate(['/']);
          this.toastr.info('Hãy chọn một vài sản phẩm rồi tiến hành thanh toán', 'Hệ thống');
        }
        this.cartDetails.forEach(item => {
          this.amountReal += item.product.price * item.quantity;
          this.amount += item.price;
        })
        this.discount = this.amount - this.amountReal;

        this.amountPaypal = (this.amount + this.finalTotal) / 24400; // arcording to currency market 04/1/2024
        this.amount += this.finalTotal;
      });
    });
  }

  checkOut() {
    if (this.postForm.valid) {
      Swal.fire({
        title: 'Bạn có muốn đặt đơn hàng này?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: 'Không',
        confirmButtonText: 'Đặt'
      }).then((result) => {
        if (!result.isConfirmed) {

          return;
        }
        else {
          let email = this.sessionService.getUser();
          this.cartService.getCart(email).subscribe(data => {
            this.cart = data as Cart;
            this.cart.address = this.postForm.value.number + ', ' + this.warName + ', ' + this.districtName + ', ' + this.provinceName;
            this.cart.phone = this.postForm.value.phone;
            this.cartService.updateCart(email, this.cart).subscribe(data => {
              this.cart = data as Cart;
              this.orderService.post(email, this.cart, this.finalTotal).subscribe(data => {
                let order:Order = data as Order;
                this.sendMessage(order.ordersId);
                Swal.fire(
                  'Thành công!',
                  'Chúc mừng bạn đã đặt hàng thành công.',
                  'success'
                )
                this.router.navigate(['/cart']);
              }, error => {
                this.toastr.error('Lỗi server', 'Hệ thống');
              })
            }, error => {
              this.toastr.error('Lỗi server', 'Hệ thống');
            })
          }, error => {
            this.toastr.error('Lỗi server', 'Hệ thống');
          })
        }
      })
    } else {
      this.toastr.error('Hãy nhập đầy đủ thông tin', 'Hệ thống');
    }
  }

  sendMessage(id:number) {
    let chatMessage = new ChatMessage(this.cart.user.name, ' đã đặt một đơn hàng');
    this.notificationService.post(new Notification(0, this.cart.user.name + ' đã đặt một đơn hàng ('+id+')')).subscribe(data => {
      this.webSocketService.sendMessage(chatMessage);
    })
  }

  getProvinces() {
    this.location.getAllProvinces().subscribe(data => {
      this.provinces = data.data as Province[];
    })
  }

  getDistricts() {
    this.location.getDistricts(this.provinceCode).subscribe(data => {
      this.districts = data.data as District[];
    })
  }

  getWards() {
    this.location.getWards(this.districtCode).subscribe(data => {
      this.wards = data.data as Ward[];
    })
  }

  getExpressService() {
    this.location.getExpress(this.districtCode, this.shopDistrictCode, this.shopId).subscribe(data => {
      this.expressChoice = data.data as ExpressChoice[];
    })
  }

  getExpressFee() {
    this.location.getExpressFee(this.expressChoiceCode, this.shopDistrictCode, this.wardCode, this.districtCode, this.amount).subscribe(data => {
      // if (typeof data.data === "undefined") {

      //   this.expressFee = data as ExpressFee;
      // } else {

      this.expressFee = data.data as ExpressFee;
      let orderCodeArray : string[] = [];
      orderCodeArray.push(this.expressFee.order_code);
      this.location.cancelOrder(orderCodeArray).subscribe(data => {});
      // }
      this.finalTotal = this.expressFee.total_fee;
      // this.getAllItem();
      this.amountPaypal = (this.amount + this.finalTotal) / 24400; // arcording to currency market 04/1/2024
    })
  }

  // getWard() {
  //   // this.location.getWard(this.wardCode).subscribe(data => {
  //   //   this.ward = data as Ward;
  //   // })
  // }

  setProvinceCode(code: any) {
    this.provinceCode = code.value;
    let provinceCurrent = this.provinces.find(item => item.ProvinceID === Number(this.provinceCode))?.ProvinceName;
    this.provinceName = provinceCurrent + "";
    this.getDistricts();
  }

  setDistrictCode(code: any) {
    this.districtCode = code.value;
    let districtCurrent = this.districts.find(item => item.DistrictID === Number(this.districtCode))?.DistrictName;
    this.districtName = districtCurrent + "";
    this.getWards();
  }

  setWardCode(code: any) {
    this.wardCode = code.value;
    let wardCurrent = this.wards.find(item => item.WardCode === this.wardCode)?.WardName;
    this.warName = wardCurrent + "";
    this.getExpressService();
  }

  setExpressChoiceCode(code: any) {
    this.expressChoiceCode = code.value;
    this.getExpressFee();
  }

  private checkOutPaypal(): void {

    this.payPalConfig = {
        currency: 'USD',
        clientId: 'Af5ZEdGAlk3_OOp29nWn8_g717UNbdcbpiPIZOZgSH4Gdneqm_y_KVFiHgrIsKM0a2dhNBfFK8TIuoOG',
        createOrderOnClient: (data) => < ICreateOrderRequest > {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value:String(this.amountPaypal.toFixed(2)),

                },

            }]
        },
        advanced: {
            commit: 'true'
        },
        style: {
            label: 'paypal',
            layout: 'vertical',
            color: 'blue',
            size: 'small',
            shape: 'rect',
        },
        onApprove: (data, actions) => {
            console.log('onApprove - transaction was approved, but not authorized', data, actions);
            actions.order.get().then((details: any) => {
                console.log('onApprove - you can get full order details inside onApprove: ', details);
            });

        },
        onClientAuthorization: (data) => {
            console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
            // this.checkOut();
            if (this.postForm.valid) {
              let email = this.sessionService.getUser();
              this.cartService.getCart(email).subscribe(data => {
                this.cart = data as Cart;
                this.cart.address = this.postForm.value.number + ', ' + this.warName + ', ' + this.districtName + ', ' + this.provinceName;
                this.cart.phone = this.postForm.value.phone;
                this.cartService.updateCart(email, this.cart).subscribe(data => {
                  this.cart = data as Cart;
                  this.orderService.post(email, this.cart, this.finalTotal).subscribe(data => {
                    let order:Order = data as Order;
                    this.sendMessage(order.ordersId);
                    Swal.fire(
                      'Thành công!',
                      'Chúc mừng bạn đã đặt hàng thành công.',
                      'success'
                    )
                    this.router.navigate(['/cart']);
                  }, error => {
                    this.toastr.error('Lỗi server', 'Hệ thống');
                  })
                }, error => {
                  this.toastr.error('Lỗi server', 'Hệ thống');
                })
              }, error => {
                this.toastr.error('Lỗi server', 'Hệ thống');
              })
            } else {
              this.toastr.error('Hãy nhập đầy đủ thông tin', 'Hệ thống');
            }
        },
        onCancel: (data, actions) => {
            console.log('OnCancel', data, actions);

        },
        onError: err => {
            console.log('OnError', err);
        },
        onClick: (data, actions) => {
            console.log('onClick', data, actions);
        },
    };
  }
}
