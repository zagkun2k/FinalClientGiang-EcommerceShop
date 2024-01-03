import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Cart } from 'src/app/common/Cart';
import { CartDetail } from 'src/app/common/CartDetail';
import { CartService } from 'src/app/services/cart.service';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

  cart!: Cart;
  cartDetail!: CartDetail;
  cartDetails!: CartDetail[];

  discount!:number;
  amount!:number;
  amountReal!:number;

  constructor(
    private cartService: CartService,
    private toastr: ToastrService,
    private router: Router,
    private sessionService: SessionService) {

   }

  ngOnInit(): void {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0)
    });
    this.discount=0;
    this.amount=0;
    this.amountReal=0;
    this.cartDetails = [];
    this.getAllItem();
  }

  getAllItem() {
    let email = this.sessionService.getUser();
    this.cartService.getCart(email).subscribe(data => {
      this.cart = data as Cart;
      this.cartService.getAllDetail(this.cart.cartId).subscribe(data => {
        this.cartDetails = data as CartDetail[];
        this.cartService.setLength(this.cartDetails.length);
        this.cartDetails.forEach(item=>{
          this.amountReal += item.product.price * item.quantity;
          this.amount += item.price;
        })
        this.discount = this.amount - this.amountReal;
      })
    })
  }

  update(id: number, quantity: number) {
    if (quantity < 0) {
      quantity = -1;  
      setTimeout(() => {

        this.toastr.info("Số lượng sản phẩm nhập vào phải hợp lí", "Hệ thống");
      });
    }

    this.cartService.getOneDetail(id, quantity).subscribe(data => {
      this.cartDetail = data as CartDetail;

      if (quantity > this.cartDetail.quantity) {

        this.toastr.info('Sản phẩm bạn muốn tăng số lượng dường như đã hết số lượng rồi', 'Hệ thống');
      }

      if (this.cartDetail.quantity === 0) {

        this.delete(id, quantity);
      } else {
        this.cartDetail.price = (this.cartDetail.product.price * (1 - this.cartDetail.product.discount / 100)) * this.cartDetail.quantity;
        this.cartService.updateDetail(this.cartDetail).subscribe(data => {
          this.ngOnInit();
        }, error => {
          this.toastr.error('Lỗi!' + error.status, 'Hệ thống');
        })
      }
    }, error => {
      if (quantity == null) {

        quantity = -1;
      }
      setTimeout(() => {

        this.cartService.getOneDetail(id, quantity).subscribe(data => {
          this.cartDetail = data as CartDetail;
  
            this.cartDetail.price = (this.cartDetail.product.price * (1 - this.cartDetail.product.discount / 100)) * this.cartDetail.quantity;
            this.cartService.updateDetail(this.cartDetail).subscribe(data => {
              this.ngOnInit();
            }, error => {
              this.toastr.error('Lỗi!' + error.status, 'Hệ thống');
            })
          
        }, error => {
          this.toastr.error('Sản phẩm bạn muốn tăng số lượng dường như đã hết số lượng rồi' + error.status, 'Hệ thống');
        })
      }, 1000);
      this.toastr.error('Số lượng sản phẩm không được trống', 'Hệ thống');
    })
    // }
  }

  delete(id: number, quantity: number) {
    Swal.fire({
      title: 'Bạn muốn xoá sản phẩm này ra khỏi giỏ hàng?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Không',
      confirmButtonText: 'Xoá'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.deleteDetail(id).subscribe(data => {
          this.toastr.success('Xoá thành công!', 'Hệ thống');
          this.ngOnInit();
        }, error => {
          this.toastr.error('Xoá thất bại! ' + error.status, 'Hệ thống');
        })
      } else {
        setTimeout(() => {

          if (quantity <= 0) {
            quantity = -1;  
          }
          this.cartService.getOneDetail(id, quantity).subscribe(data => {
            this.cartDetail = data as CartDetail;
  
              this.cartDetail.price = (this.cartDetail.product.price * (1 - this.cartDetail.product.discount / 100)) * this.cartDetail.quantity;
              this.cartService.updateDetail(this.cartDetail).subscribe(data => {
                this.ngOnInit();
              }, error => {
                this.toastr.error('Lỗi!' + error.status, 'Hệ thống');
              })
            
          }, error => {
            this.toastr.error('Sản phẩm bạn muốn tăng số lượng dường như đã hết số lượng rồi' + error.status, 'Hệ thống');
          })
        }, 1000);
      }
    })
  }

}
