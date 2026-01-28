'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import type { Cart } from '@/lib/types';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { DUMMY_PROMPTS } from '@/lib/dummy-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { placeholderImages } from '@/lib/dummy-data';
import { Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const cartRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid, 'carts', 'active') : null),
    [firestore, user]
  );

  const { data: cart, isLoading } = useDoc<Cart>(cartRef);

  const cartItems = useMemo(() => {
    if (!cart?.promptIds) return [];
    return DUMMY_PROMPTS.filter((prompt) => cart.promptIds.includes(prompt.id));
  }, [cart]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price, 0);
  }, [cartItems]);

  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const renderContent = () => {
    if (isLoading) {
      return <p>Завантаження кошика...</p>;
    }

    if (!cart || cartItems.length === 0) {
      return <p>Ваш кошик порожній.</p>;
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const itemImage = placeholderImages.find(p => p.id === item.images[0]);
            return (
              <Card key={item.id} className="flex items-center p-4">
                <div className="relative w-24 h-24 aspect-square overflow-hidden rounded-md mr-4">
                  {itemImage && (
                     <Image
                        src={itemImage.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        data-ai-hint={itemImage.imageHint}
                     />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{DUMMY_PROMPTS.find(p => p.id === item.id)?.description}</p>
                </div>
                <div className="flex items-center gap-4">
                   <p className="font-bold text-lg">{item.price === 0 ? 'Free' : `$${item.price.toFixed(2)}`}</p>
                   <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-5 w-5" />
                   </Button>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Підсумок</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Проміжний підсумок</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Податок</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Всього</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button size="lg" className="w-full">Перейти до оплати</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-8">Ваш кошик</h1>
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}
