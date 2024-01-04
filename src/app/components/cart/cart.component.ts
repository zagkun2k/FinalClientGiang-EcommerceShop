import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Cart } from 'src/app/common/Cart';
import { CartDetail } from 'src/app/common/CartDetail';
import { CartService } from 'src/app/services/cart.service';
import { SessionService } from 'src/app/services/session.service';
import { FavoritesService } from 'src/app/services/favorites.service';
import { Favorites } from 'src/app/common/Favorites';
import { CustomerService } from 'src/app/services/customer.service';
import { Customer } from 'src/app/common/Customer';
import { Product } from 'src/app/common/Product';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

  cart!: Cart;
  customer!: Customer;
  cartDetail!: CartDetail;
  cartDetails!: CartDetail[];
  favorites!: Favorites[];

  discount!:number;
  amount!:number;
  amountReal!:number;

  constructor(
    private cartService: CartService,
    private toastr: ToastrService,
    private router: Router,
    private sessionService: SessionService,
    private favoriteService: FavoritesService,
    private customerService: CustomerService) {

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
    this.checkQuantity();
  }

  checkQuantity() {
    let email = this.sessionService.getUser();
    this.cartService.getCart(email).subscribe(data => {
      this.cart = data as Cart;
      this.cartService.getAllDetail(this.cart.cartId).subscribe(data => {
        this.cartDetails = data as CartDetail[];
        for (let item of this.cartDetails) {

          if (item.product.quantity - item.quantity < 0) {

            Swal.fire({
              title: `Sản phẩm ${item.product.name} vừa có thay đổi về số lượng, bạn có muốn tiếp tục mua hàng không?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#d33',
              cancelButtonText: 'Chuyển vào ưu thích',
              confirmButtonText: 'Tiếp tục mua hàng'
            }).then((result) => {
              if (result.isConfirmed) {
               
                item.quantity = item.product.quantity;
                this.tempUpdate(item.cartDetailId, item.quantity);
                this.ngOnInit();
              } else {
                
                let email = this.sessionService.getUser();
                this.favoriteService.getByEmail(email).subscribe(data=>{
                  this.favorites = data as Favorites[];
                  let productIdList: number[] = []; 
                  for (let favor of this.favorites) {

                    if (!productIdList.includes(favor.product.productId)) {

                      productIdList.push(favor.product.productId);
                    }
                  }

                  if (!productIdList.includes(item.product.productId)) {

                    this.customerService.getByEmail(email).subscribe(data => {
                      this.customer = data as Customer;
                      this.favoriteService.post(new Favorites(0, new Customer(this.customer.userId), new Product(item.product.productId))).subscribe(data => {
                        this.toastr.success('Thêm thành công!', 'Hệ thống');
                        this.favoriteService.getByEmail(email).subscribe(data => {
                          this.favorites = data as Favorites[];
                          this.favoriteService.setLength(this.favorites.length);
                        })
                      })
                    })
                  } else {

                      this.toastr.info('Sản phẩm này đã có trong ưu thích rồi!', 'Hệ thống');
                  }
                })

                this.cartService.deleteDetail(item.cartDetailId).subscribe(data => {
                  this.ngOnInit();
                })
              }
            })
          }
        }
      })
    })
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

  tempUpdate(id: number, quantity: number) {

    if (quantity < 0) {
      quantity = -1;  
      setTimeout(() => {

        // this.toastr.info("Số lượng sản phẩm nhập vào phải hợp lí", "Hệ thống");
      });
    }

    this.cartService.getOneDetail(id, quantity).subscribe(data => {
      this.cartDetail = data as CartDetail;

      if (quantity > this.cartDetail.quantity) {

        this.toastr.info('Sản phẩm bạn muốn tăng số lượng dường như đã hết số lượng rồi', 'Hệ thống');
      }

      if (this.cartDetail.quantity === 0) {

        this.tempDelete(id, quantity, this.cartDetail.product.name);
        let email = this.sessionService.getUser();
        this.favoriteService.getByEmail(email).subscribe(data=>{
          this.favorites = data as Favorites[];
          let productIdList: number[] = [];
          for (let favor of this.favorites) {

            if(!productIdList.includes(favor.product.productId)) {

              productIdList.push(favor.product.productId);
            }
          }
          if (!productIdList.includes(this.cartDetail.product.productId)) {

            this.customerService.getByEmail(email).subscribe(data => {
              this.customer = data as Customer;
              this.favoriteService.post(new Favorites(0, new Customer(this.customer.userId), new Product(this.cartDetail.product.productId))).subscribe(data => {
                this.toastr.success('Thêm thành công!', 'Hệ thống');
                this.favoriteService.getByEmail(email).subscribe(data => {
                  this.favorites = data as Favorites[];
                  this.favoriteService.setLength(this.favorites.length);
                })
              })
            })
          } else {

              this.toastr.info('Sản phẩm này đã có trong ưu thích rồi!', 'Hệ thống');
          }
        })
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

        this.delete(id, quantity, this.cartDetail.product.name);
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

  tempDelete(id: number, quantity: number, name: string) {

    Swal.fire({
      title: `Sản phẩm ${name} này đã hết hàng, chúng tôi sẽ loại bỏ nó khỏi giỏ hàng và đồng thời thêm nó vào danh mục ưu thích của bạn cho những trải nghiệm sau này nếu muốn, xin cảm ơn!!!`,
      icon: 'info',
      showCancelButton: false,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Xác nhận'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.deleteDetail(id).subscribe(data => {
          this.toastr.success('Xoá thành công!', 'Hệ thống');
          this.ngOnInit();
        }, error => {
          this.toastr.error('Xoá thất bại! ' + error.status, 'Hệ thống');
        })
      }
    })
  }

  delete(id: number, quantity: number, name: string) {
    Swal.fire({
      title: `Bạn muốn xoá ${name} ra khỏi giỏ hàng?`,
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
