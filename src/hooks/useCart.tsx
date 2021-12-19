import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart') || ''

    if (storagedCart === '') {
      return []
    }
    else {
      return JSON.parse(storagedCart)
    }
  });

  // useEffect(() => {
  //   localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  // }, [cart])

  const addProduct = async (productId: number) => {
    try {
      const response = await api(`products/${productId}`)
      let data = response.data

      const stockResponse = await api(`stock/${productId}`)
      const stockData = stockResponse.data

      let productIndex = cart.findIndex(product => {
        return product.id === productId
      })

      if (productIndex !== -1 && cart[productIndex].amount >= stockData.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      data.amount = 1

      if (cart.length === 0) {
        setCart([data])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([data]))
      }
      else {
        const addingOneUnitOnProductAmount = cart.map(product => {
          if (product.id === productId && product.amount < stockData.amount) {
            product.amount = product.amount + 1
            return product
          }
          return product
        })

        setCart(addingOneUnitOnProductAmount)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(addingOneUnitOnProductAmount))


        const booleanArray = cart.map(cartItem => {
          if (cartItem.id === productId) {
            return false
          }
          else {
            return true
          }
        }).filter(booleanItem => booleanItem === false)

        if (booleanArray[0] !== false) {
          setCart([...cart, data])
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, data]))
        }
      }

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const productExist = cart.map(product => {
        if (productId === product.id) {
          return true
        }
        return false
      }).filter(product => product === true)

      if (productExist[0] === true) {
        const productRemovedArray = cart.filter(product => { return product.id !== productId })
        setCart(productRemovedArray)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(productRemovedArray))
      }
      else {
        throw Error
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {

      const response = await api(`stock/${productId}`)
      const data = response.data

      if (amount < 1) {
        return
      }

      const updatedProductAmountArray = cart.map(product => {
        if (productId === product.id && amount <= data.amount) {
          product.amount = amount
          return product
        }
        return product
      })

      console.log(amount, data.amount)
      if (amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque')
      }
      else {
        setCart(updatedProductAmountArray)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProductAmountArray))
      }


    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
