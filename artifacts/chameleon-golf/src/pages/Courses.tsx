import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetCourses } from "@workspace/api-client-react";
import { useCreateCourse } from "@/hooks/use-golf";
import { CourseCard } from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  location: z.string().optional(),
  holes: z.coerce.number(),
  par: z.coerce.number().min(27).max(75)
});

export default function Courses() {
  const { data: courses, isLoading } = useGetCourses();
  const createCourse = useCreateCourse();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      holes: 18,
      par: 72
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createCourse.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="font-display text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage the courses you play.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md shadow-primary/20 gap-2">
              <Plus size={18} /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Add New Course</DialogTitle>
              <DialogDescription>Enter the course details below to add it to your roster.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pebble Beach" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Carmel, CA" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="holes"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Holes</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(val) => {
                               field.onChange(parseInt(val));
                               form.setValue('par', val === '9' ? 36 : 72);
                            }}
                            defaultValue={field.value.toString()}
                            className="flex gap-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="9" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">9 Holes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="18" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">18 Holes</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="par"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Par</FormLabel>
                        <FormControl>
                          <Input type="number" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createCourse.isPending} className="w-full sm:w-auto h-11 px-8">
                    {createCourse.isPending ? "Adding..." : "Add Course"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl"></div>)}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-50 border border-dashed rounded-2xl">
          <p className="text-muted-foreground mb-4">No courses available. Add one to get started!</p>
          <Button variant="outline" onClick={() => setOpen(true)}>Add your first course</Button>
        </div>
      )}
    </motion.div>
  );
}
