import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Loader2, Plus, Trash2, Edit3, X, Check } from "lucide-react";

function AdminFaq() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [catForm, setCatForm] = useState({ title: "", description: "", sort_order: 0 });
  const [itemForm, setItemForm] = useState({ category_id: "", question: "", answer: "", sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  const loadFaq = async () => {
    try {
      setLoading(true);
      const response = await api.get("/faq");
      setCategories(response.data.categories || []);
    } catch (err) {
      toast.error("Failed to load FAQ content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFaq(); }, []);

  const createCategory = async (e) => {
    e.preventDefault();
    if (!catForm.title.trim()) {
      toast.error("Category title is required.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/faq/categories", catForm);
      toast.success("Category created.");
      setCatForm({ title: "", description: "", sort_order: 0 });
      setShowCatForm(false);
      await loadFaq();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  const createItem = async (e) => {
    e.preventDefault();
    if (!itemForm.question.trim() || !itemForm.answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }
    if (!itemForm.category_id) {
      toast.error("Please select a category.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/faq/items", itemForm);
      toast.success("FAQ item added.");
      setItemForm({ category_id: "", question: "", answer: "", sort_order: 0 });
      setShowItemForm(false);
      await loadFaq();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add FAQ item.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category? Its items will be orphaned.")) return;
    try {
      await api.delete(`/faq/categories/${id}`);
      toast.success("Category deleted.");
      await loadFaq();
    } catch (err) {
      toast.error("Failed to delete category.");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this FAQ item?")) return;
    try {
      await api.delete(`/faq/items/${id}`);
      toast.success("Item deleted.");
      await loadFaq();
    } catch (err) {
      toast.error("Failed to delete item.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Help Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage FAQ categories and questions shown on the Help Center page.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowCatForm(!showCatForm); setShowItemForm(false); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
          <Button onClick={() => { setShowItemForm(!showItemForm); setShowCatForm(false); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {showCatForm && (
        <form onSubmit={createCategory} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <Input
            value={catForm.title}
            onChange={(e) => setCatForm((c) => ({ ...c, title: e.target.value }))}
            placeholder="Category title (e.g., Registration)"
          />
          <Textarea
            value={catForm.description}
            onChange={(e) => setCatForm((c) => ({ ...c, description: e.target.value }))}
            placeholder="Short description (optional)"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCatForm(false)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save Category
            </Button>
          </div>
        </form>
      )}

      {showItemForm && (
        <form onSubmit={createItem} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <select
            value={itemForm.category_id}
            onChange={(e) => { setItemForm((c) => ({ ...c, category_id: e.target.value })); setSelectedCatId(e.target.value); }}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.title}</option>
            ))}
          </select>
          <Input
            value={itemForm.question}
            onChange={(e) => setItemForm((c) => ({ ...c, question: e.target.value }))}
            placeholder="Question (e.g., How do I reset my password?)"
          />
          <Textarea
            value={itemForm.answer}
            onChange={(e) => setItemForm((c) => ({ ...c, answer: e.target.value }))}
            placeholder="Answer..."
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowItemForm(false)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save Item
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No FAQ content yet. Add a category to get started.
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border bg-muted/20 px-5 py-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-foreground">{cat.title}</h2>
                  <Badge variant="secondary">{cat.items?.length || 0} items</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setShowCatForm(true); setCatForm({ title: cat.title, description: cat.description || "", sort_order: cat.sort_order || 0 }); }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Edit (via Add Category form)"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {cat.description && <p className="border-b border-border px-5 py-3 text-sm text-muted-foreground">{cat.description}</p>}
              <div className="divide-y divide-border">
                {(cat.items || []).length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted-foreground">No items in this category.</p>
                ) : (
                  (cat.items || []).map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{item.question}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground whitespace-pre-wrap">{item.answer}</p>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="shrink-0 rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminFaq;
