import * as z from "zod"
import { CompleteDescription, RelatedDescriptionModel, CompleteAddress, RelatedAddressModel, CompleteFavorite, RelatedFavoriteModel, CompleteImages, RelatedImagesModel, CompleteUser, RelatedUserModel } from "./index"

export const PropertyModel = z.object({
  id: z.number().int(),
  created_at: z.date(),
  updated_at: z.date(),
  user_id: z.number().int(),
})

export interface CompleteProperty extends z.infer<typeof PropertyModel> {
  description?: CompleteDescription | null
  address?: CompleteAddress | null
  favorites: CompleteFavorite[]
  images: CompleteImages[]
  listed_by: CompleteUser
}

/**
 * RelatedPropertyModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedPropertyModel: z.ZodSchema<CompleteProperty> = z.lazy(() => PropertyModel.extend({
  description: RelatedDescriptionModel.nullish(),
  address: RelatedAddressModel.nullish(),
  favorites: RelatedFavoriteModel.array(),
  images: RelatedImagesModel.array(),
  listed_by: RelatedUserModel,
}))
