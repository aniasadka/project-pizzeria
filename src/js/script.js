/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars
{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.processOrder();
      thisProduct.initAmountWidget();


      console.log('new Product:', thisProduct);
    }

    //TASK 9.3 
    //Najpierw za pomocą odpowiedniego szablonu tworzymy kod HTML i zapisujemy go w stałej generatedHTML.
    //Następnie ten kod zamieniamy na elementy DOM i zapisujemy w następnej stałej – generatedDOM.
    //Dodajemy te elementy DOM do thisCart.dom.productList.
    //Pamiętamy o zdefiniowaniu thisCart.dom.productList w metodzie getElements.

    renderInMenu() {
      const thisProduct = this;

      /*generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);

      /* create element using utils.createElementsFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /*find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);

      /*add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() {
      const thisProduct = this;

      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        event.preventDefault();

        const activeProducts = document.querySelectorAll('.product.active');

        for (let activeProduct of activeProducts) {

          if (activeProduct != thisProduct.element) {
            activeProduct.classList.remove('active');
          }
        }

        thisProduct.element.classList.toggle('active');
      });
    }

    initOrderForm() {
      const thisProduct = this;
      //console.log('initOrderForm');

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });

        thisProduct.cartButton.addEventListener('click', function (event) {
          event.preventDefault();
          thisProduct.processOrder();
          thisProduct.addToCart();
        });
      }
    }

    processOrder() {
      const thisProduct = this;
      //console.log('processOrder');


      const formData = utils.serializeFormToObject(thisProduct.form);
      /* set variable price to equal thisProduct.data.price */
      thisProduct.params = {};

      let price = thisProduct.data.price;

      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for (let optionId in param.options) {
          const option = param.options[optionId];

          const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;

          if (optionSelected && !option.default) {
            price += option.price;
          } else if (!optionSelected && option.default) {
            price -= option.price;
          }

          if (!thisProduct.params[paramId]) {
            thisProduct.params[paramId] = {
              label: param.label,
              options: {},
            };
          }
          thisProduct.params[paramId].options[optionId] = option.label;

          const imageClass = thisProduct.imageWrapper.querySelectorAll('.' + paramId + '-' + optionId);

          if (optionSelected) {
            if (!thisProduct.params[paramId]) {
              thisProduct.params[paramId] = {
                label: param.label,
                options: {},
              };
            }
            thisProduct.params[paramId].options[optionId] = option.label;

            for (let singleClass of imageClass) {
              singleClass.classList.add(classNames.menuProduct.imageVisible);
            }
          } else {
            for (let singleClass of imageClass) {
              singleClass.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }


      /*multiply price by amount */
      thisProduct.priceSingle = price;
      thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

      /* set the contents of thisProduct.priceElem to be the value of variable price */
      thisProduct.priceElem.innerHTML = thisProduct.price;
    }

    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }

    addToCart() {
      const thisProduct = this;

      thisProduct.name = thisProduct.data.name;
      thisProduct.amount = thisProduct.amountWidget.value;
      app.cart.add(thisProduct);
    }
  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.setValue(thisWidget.input.value);


      //console.log('AmountWidget', thisWidget);
      //console.log('constructor arguments:', element);
    }

    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value) {
      const thisWidget = this;

      const newValue = parseInt(value);

      //to do: add validation
      // newValue - będziemy sprawdzać, czy wartość jest poprawna, czy mieści się w zakresie; jeśli tak, zostanie zapisana jako wartość thisWidget.value

      if (newValue != thisWidget.value && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
        // console.log(newValue);
        // console.log(thisWidget.value);
        thisWidget.value = newValue; // zapisanie wartości przekazanego arg. po przekonwertowaniu go na liczbę
        thisWidget.announce();


        thisWidget.input.value = thisWidget.value; // ustawienie nowej wartości inputa; dzięki temu nowa wartość wyswietli się na stronie



      }

      initActions() {
        const thisWidget = this;

        thisWidget.input.addEventListener('change', function () {
          thisWidget.setValue(thisWidget.input.value);
        });

        thisWidget.linkDecrease.addEventListener('click', function (event) {
          event.preventDefault();
          thisWidget.setValue(thisWidget.value - 1);
        });

        thisWidget.linkIncrease.addEventListener('click', function (event) {
          event.preventDefault();
          thisWidget.setValue(thisWidget.value + 1);
        });
      }

      announce() {
        const thisWidget = this;

        const event = new CustomEvent('updated', {
          bubbles: true
        });

        thisWidget.element.dispatchEvent(event);
      }
    }


    class Cart {
      constructor(element) {
        const thisCart = this;

        thisCart.products = [];

        thisCart.getElements(element);
        thisCart.initActions();

        thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

        //console.log('new Cart', thisCart);
      }

      getElements(element) {
        const thisCart = this;
        thisCart.dom = {};

        thisCart.dom.wrapper = element;
        thisCart.dom.toggleTrigger = document.querySelector(select.cart.toggleTrigger);

        thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];

        for (let key of thisCart.renderTotalsKeys) {
          thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
        }
      }


      initActions() {
        const thisCart = this;

        thisCart.dom.toggleTrigger.addEventListener('click', function () {
          thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
        });

        thisCart.dom.productList.addEventListener('updated', function () {
          thisCart.update();
        });

        thisCart.dom.productList.addEventListener('remove', function () {
          thisCart.remove(event.detail.cartProduct);
        });
      }

      add(menuProduct) {
        const thisCart = this;

        thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

        //console.log('thisCard.products', thisCart.products);
        //console.log('adding product', menuProduct);
      }

      update() {
        const thisCart = this;

        thisCart.totalNumber = 0;
        thisCart.subtotalPrice = 0;

        for (let singleProduct of thisCart.products) {
          thisCart.subtotalPrice = thisCart.subtotalPrice + singleProduct.price;
          thisCart.totalNumber = thisCart.totalNumber + singleProduct.amount;
        }

        thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFree;

        for (let key of thisCart.renderTotalsKeys) {
          for (let elem of thisCart.dom[key]) {
            elem.innerHTML = thisCart[key];
          }
        }
      }

      remove(CartProduct) {
        const thisCart = this;

        const index = thisCart.products.indexOf(cartProduct);
        thisCart.products.splice(index, 1);

        const removeDOM = cartProduct.dom.wrapper;
        removeDOM.remove();

        thisCart.update();
      }
    }


    class CartProduct {
      constructor(menuProduct, element) {
        const thisCartProduct = this;

        thisCartProduct.id = menuProduct.id;
        thisCartProduct.name = menuProduct.name;
        thisCartProduct.price = menuProduct.price;
        thisCartProduct.priceSingle = menuProduct.priceSingle;
        thisCartProduct.amount = menuProduct.amount;
        thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));

        thisCartProduct.getElements(element);
        thisCartProduct.initAmountWidget();
        thisCartProduct.initActions();
      }

      //console.log('new CartProduct', thisCartProduct);
      //console.log('productData', menuProduct);



      getElements(element) {
        const thisCartProduct = this;

        thisCartProduct.dom = {};

        thisCartProduct.dom.wrapper = element;
        thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
        thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
        thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
        thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
      }

      initAmountWidget() {
        const thisCartProduct = this;

        thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

        thisCartProduct.amountWidgetElem.addEventListener('updated', function () {
          thisCartProduct.amount = thisCartProduct.amountWidget.value;
          thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;

          thisCartProduct.price.innerHTML - thisCartProduct.price;
        });
      }

      remove() {
        const thisCartProduct = this;

        const event = new CustomEvent('remove', {
          bubbles: true,
          detail: {
            cartProduct: thisCartProduct,
          },
        });

        thisCartProduct.dom.wrapper.dispatchEvent(event);
      }

      initActions() {
        const thisCartProduct = this;

        thisCartProduct.dom.edit.addEventListener('click', function (event) {
          event.preventDefault();
        });

        thisCartProduct.dom.remove.addEventListener('click', function (event) {
          event.preventDefault();
          thisCartProduct.remove();
        });
      }
    }


    const app = {
      initMenu: function () {
        const thisApp = this;
        // console.log('thisApp.data:', thisApp.data);
        for (let productData in thisApp.data.products) {
          new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);

        }
      },

      initData: function () {
        const thisApp = this;

        thisApp.data = {};

        const url = settings.db.url + '/' + settings.db.product;

        fetch(url)
          .then(function (rawResponse) {
            return rawResponse.json();
          })
          .then(function (parsedResponse) {
            console.log('parsedResponse', parsedResponse);

            /* save parsedResponse as thisAppdata.products */

            /* execute init Menu method */
          });

        console.log('thisApp.data', JSON.stringify(thisApp.data));

      },

      init: function () {
        const thisApp = this;
        //console.log('*** App starting ***');
        //console.log('thisApp:', thisApp);
        //console.log('classNames:', classNames);
        //console.log('settings:', settings);
        //console.log('templates:', templates);

        thisApp.initData();
        thisApp.initCart();
      },

      initCart: function () {
        const thisApp = this;

        const cartElem = document.querySelector(select.containerOf.cart);
        thisApp.cart = new Cart(cartElem);
      },
    };



    app.init();
  }
