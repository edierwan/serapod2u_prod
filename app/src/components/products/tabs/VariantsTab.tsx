'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Search, Loader2, Package } from 'lucide-react'
import VariantDialog from '../dialogs/VariantDialog'

interface Product {
  id: string
  product_name: string
}

interface Variant {
  id: string
  product_id: string
  variant_name: string
  attributes: Record<string, any>
  barcode: string | null
  manufacturer_sku: string | null
  base_cost: number | null
  suggested_retail_price: number | null
  is_active: boolean
  is_default: boolean
  created_at: string
  product_name?: string
  image_url?: string | null
}

interface VariantsTabProps {
  userProfile: any
  onRefresh: () => void
  refreshTrigger: number
}

export default function VariantsTab({ userProfile, onRefresh, refreshTrigger }: VariantsTabProps) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { isReady, supabase } = useSupabaseAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (isReady) {
      loadProducts()
      loadVariants()
    }
  }, [isReady, refreshTrigger])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, product_name')
        .eq('is_active', true)
        .order('product_name', { ascending: true })

      if (error) throw error
      setProducts((data || []) as Product[])
      if (data && data.length > 0 && !selectedProduct) {
        setSelectedProduct((data as any[])[0].id)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadVariants = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('product_variants')
        .select('*, products(product_name)')
        .order('variant_name', { ascending: true })

      if (error) throw error
      const variantsData = (data || []).map((variant: any) => ({
        ...variant,
        product_name: variant.products?.product_name || '-',
        image_url: variant.image_url || null
      }))
      setVariants(variantsData as Variant[])
    } catch (error) {
      console.error('Error loading variants:', error)
      toast({
        title: 'Error',
        description: 'Failed to load variants',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getVariantInitials = (name: string) => {
    if (!name) return 'V'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSave = async (variantData: Partial<Variant> & { imageFile?: File }) => {
    try {
      setIsSaving(true)
      
      let imageUrl = variantData.image_url || null

      // Handle image upload if there's a new image file
      if (variantData.imageFile) {
        const file = variantData.imageFile
        const fileExt = file.name.split('.').pop()
        const fileName = `variant-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to avatars bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL with cache-busting
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path)

        imageUrl = `${publicUrl}?v=${Date.now()}`
      }

      // Remove imageFile from data before saving to database
      const { imageFile, ...dbData } = variantData
      const dataToSave = {
        ...dbData,
        image_url: imageUrl
      }

      if (editingVariant) {
        const { error } = await (supabase as any)
          .from('product_variants')
          .update(dataToSave)
          .eq('id', editingVariant.id)
        if (error) throw error
        toast({
          title: 'Success',
          description: 'Variant updated successfully'
        })
      } else {
        const { error } = await (supabase as any)
          .from('product_variants')
          .insert([dataToSave])
        if (error) throw error
        toast({
          title: 'Success',
          description: 'Variant created successfully'
        })
      }
      setDialogOpen(false)
      setEditingVariant(null)
      loadVariants()
    } catch (error) {
      console.error('Error saving variant:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save variant',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return
    try {
      const { error } = await (supabase as any)
        .from('product_variants')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      toast({
        title: 'Success',
        description: 'Variant deleted successfully'
      })
      loadVariants()
    } catch (error) {
      console.error('Error deleting variant:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete variant',
        variant: 'destructive'
      })
    }
  }

  const filteredVariants = variants.filter(variant => {
    const matchesSearch = variant.variant_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProduct = !selectedProduct || variant.product_id === selectedProduct
    return matchesSearch && matchesProduct && variant.is_active
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3 flex-1">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Products</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.product_name}</option>
            ))}
          </select>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search variants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingVariant(null)
            setDialogOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variant
        </Button>
      </div>

      <VariantDialog
        variant={editingVariant}
        products={products}
        open={dialogOpen}
        isSaving={isSaving}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead className="text-right">Base Cost</TableHead>
              <TableHead className="text-right">Retail Price</TableHead>
              <TableHead className="text-center">Default</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVariants.length > 0 ? (
              filteredVariants.map((variant) => (
                <TableRow key={variant.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Avatar className="w-10 h-10 rounded-lg" key={variant.image_url || variant.id}>
                      <AvatarImage 
                        src={variant.image_url || undefined} 
                        alt={`${variant.variant_name} image`}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-lg bg-blue-100 text-blue-600 text-xs font-semibold">
                        {getVariantInitials(variant.variant_name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>{variant.variant_name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{variant.product_name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{variant.barcode || '-'}</TableCell>
                  <TableCell className="text-right text-sm">{variant.base_cost ? `$${variant.base_cost.toFixed(2)}` : '-'}</TableCell>
                  <TableCell className="text-right text-sm">{variant.suggested_retail_price ? `$${variant.suggested_retail_price.toFixed(2)}` : '-'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={variant.is_default ? 'default' : 'secondary'} className="text-xs">
                      {variant.is_default ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                      {variant.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingVariant(variant)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(variant.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No variants found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-600">
        Showing {filteredVariants.length} of {variants.filter(v => v.is_active).length} variants
      </div>
    </div>
  )
}
