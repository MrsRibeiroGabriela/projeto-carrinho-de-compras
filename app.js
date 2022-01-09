//declarando variáveis
const cartBtn = document.querySelector(".cart-btn"); //navbar
const closeCartBtn = document.querySelector(".close-cart");//cart footer
const clearCartBtn = document.querySelector(".clear-cart");//cart footer
const cartDOM = document.querySelector(".cart");//cart
const cartOverlay = document.querySelector(".cart-overlay"); //cart
const cartItems = document.querySelector(".cart-items"); //navbar
const cartTotal = document.querySelector(".cart-total"); //cart footer
const cartContent = document.querySelector(".cart-content"); //cart
const productsDOM = document.querySelector(".products-center"); //products


//lista de produtos do carrinho
let cart = [];
//botões
let buttonsDOM = [];

//classe responsável por pegar os produtos (localmente do product-json)
class Products {
    async getProducts(){
        try {
            let result = await fetch('products.json');
            let data = await result.json();

            let products = data.items;
            products = products.map(item => {
                const {title,price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title,price,id,image};
            })
            return products;
        } catch (error) {
            console.log(error);
        }
    
    }
}
//mostrar produtos
class UI {
    displayProducts(products){
        let result = '';
        products.forEach(product => {
            result += `
            <!--SINGLE PRODUCT-->
                <article class="product">
                    <div class="img-container">
                        <img src=${product.image} alt="produto" class="product-img">
                        <button class="bag-btn" data-id=${product.id}>
                            <i class="fas fa-shopping-cart"></i>
                            Adicionar ao Carrinho
                        </button>
                    </div>
                    <h3>${product.title}</h3>
                    <h4>R$${product.price}</h4>
                </article>
            <!--END OF SINGLE PRODUCT-->
            `;
        });
        productsDOM.innerHTML = result;
    }
    getBagButtons(){
        //array de botões
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            let inCart = cart.find(item => item.id === id);
            if(inCart){
                button.innerText = "No carrinho";
                button.disabled = true;
            }
            button.addEventListener('click', (event)=> {
                event.target.innerText = "No carrinho";
                event.target.disabled = true;
                //pegar o produto de products
                let cartItem = {...Storage.getProduct(id), amount:1};
                //adicionar o produto ao carrinho
                cart = [...cart,cartItem];
                //salvar o carrinho no armazenamento local
                Storage.saveCart(cart)
                //definir os valores do carrinho(total, quantidade de produtos)
                this.setCartValues(cart);
                //mostrar o item no carrinho
                this.addCartItem(cartItem);
                //mostrar o carrinho
                this.showCart();
            })
        });
    }
    setCartValues(cart){
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.amount; //preço total dos produtos no carrinho
            itemsTotal += item.amount; //contador no navbar da quantidade de produtos no carrinho
        })
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2))
        cartItems.innerText = itemsTotal;
    }
    addCartItem(item){
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
        <img src=${item.image}>
        <div>
            <h4>${item.title}</h4>
            <h5>R$${item.price}</h5>
            <span class="remove-item" data-id=${item.id}>remover</span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id=${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fas fa-chevron-down" data-id=${item.id}></i>
        </div>`;
        cartContent.appendChild(div);
        
    }
    showCart() {
        cartOverlay.classList.add("transparentBcg");
        cartDOM.classList.add("showCart");
    }
    setupApp(){
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener('click',this.showCart);
        closeCartBtn.addEventListener('click',this.hideCart);
    }
    populateCart(cart){
        cart.forEach(item => this.addCartItem(item));
    }
    hideCart() {
        cartOverlay.classList.remove("transparentBcg");
        cartDOM.classList.remove("showCart");
    }
    cartLogic() {
        //botão de limpar o carrinho
        clearCartBtn.addEventListener('click', () => {
            this.clearCart();
        })
        //funcionalidades do carrinho
        cartContent.addEventListener('click',event => {
            if(event.target.classList.contains('remove-item')){
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);
            } else if (event.target.classList.contains('fa-chevron-up')){
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                //aumenta o preço a medida que aumenta a quantidade
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            } else if (event.target.classList.contains('fa-chevron-down')){
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                //diminui o preço a medida que diminui a quantidade
                tempItem.amount = tempItem.amount - 1;
                if(tempItem.amount > 0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                } else {
                    cartContent.removeChild(lowerAmount.parentElement.parentElement);
                    this.removeItem(id);
                }
            }
        });
    }
    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        while(cartContent.children.length>0){
            cartContent.removeChild(cartContent.children[0])
        }
        this.hideCart();
    }
    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class ="fas fa-shopping-cart"></i>Adicionar ao Carrinho`;
    }
    getSingleButton(id){
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}
//armazenamento local
class Storage {
    //método estático
    static saveProducts(products){
        localStorage.setItem("products", JSON.stringify(products));
    }
    static getProduct(id){
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id === id);
    }
    static saveCart(){
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    static getCart(){
        return localStorage.getItem('cart')?JSON.parse(localStorage.getItem('cart')):[];
    }
}
//DOMContentLoaded: acionado quando todo o HTML foi completamente carregado e analisado
document.addEventListener("DOMContentLoaded", () => { 
    //instâncias
    const ui = new UI();
    const products = new Products();
    //setup App
    ui.setupApp();
    //pegar todos os produtos
    products.getProducts().then(products => {
        ui.displayProducts(products)
        Storage.saveProducts(products);
    }).then(() => {
        ui.getBagButtons();
        ui.cartLogic();
    });
});

