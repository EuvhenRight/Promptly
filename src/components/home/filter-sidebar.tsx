import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { DUMMY_FILTERS } from '@/lib/dummy-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FilterSidebarProps = {
  className?: string;
};

export default function FilterSidebar({ className }: FilterSidebarProps) {
  return (
    <aside className={cn('space-y-6', className)}>
      <div className="sticky top-24">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion
              type="multiple"
              defaultValue={['categories', 'models', 'price']}
              className="w-full"
            >
              <AccordionItem value="categories">
                <AccordionTrigger className="font-semibold">
                  Categories
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {DUMMY_FILTERS.categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox id={`cat-${category.id}`} />
                        <Label htmlFor={`cat-${category.id}`} className="font-normal">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="models">
                <AccordionTrigger className="font-semibold">
                  AI Models
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {DUMMY_FILTERS.models.map((model) => (
                      <div key={model.id} className="flex items-center space-x-2">
                        <Checkbox id={`model-${model.id}`} />
                        <Label htmlFor={`model-${model.id}`} className="font-normal">
                          {model.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="price">
                <AccordionTrigger className="font-semibold">
                  Price Range
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-1 pt-2">
                    <Slider defaultValue={[0, 50]} max={100} step={1} />
                    <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                      <span>$0</span>
                      <span>$100+</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
