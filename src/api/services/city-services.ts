import { prisma } from '../config/prisma-connect.js';
import { City } from '@prisma/client';
import { PaginationParameters } from '../interfaces/pagination-parameters.js';
import { GeocodingAPI } from '../maps/geocode-api.js';
import { IUpdateCity } from '../interfaces/update-city.js';
import { MultipartFile } from '@fastify/multipart';
import { ERR_CITY_ALREADY_EXISTS, ERR_CITY_NOT_FOUND, ERR_INVALID_CITY } from '../errors/city-errors';
import storageServices from './storage-services.js';
import { env_storageBaseUrl } from '../../environment.js';
import { getFileName } from '../helpers/get-filename.js';

const citiesServices = {
  getAllCities: async ({ page_number, per_page_number, skip }: PaginationParameters): Promise<Object> => {
    const [cities, count] = await Promise.all([
      prisma.city.findMany({
        skip,
        take: per_page_number,
        include: {
          province: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.city.count(),
    ]);
    const pages = Math.ceil(count / per_page_number);
    return { count, page: page_number, per_page: per_page_number, pages, cities };
  },

  getOneCity: async (id: number) => {
    const city = await prisma.city.findUnique({ where: { id } });
    if (city) {
      return city;
    } else {
      throw { code: '_', message: 'Esta cidade não existe', statusCode: 400 };
    }
  },

  createOneCity: async (attributes: City): Promise<City | Error> => {
    const province = await prisma.province.findUnique({ where: { id: attributes.province_id } });
    if (!province) throw { code: '_', message: 'Província inválida!', statusCode: 422 };

    const geocode = await GeocodingAPI.getDataForCity(province.short_name, attributes.name);

    if (typeof geocode === 'object') {
      const { name, latitude, longitude, place_id } = geocode;
      const cityExists = await prisma.city.findUnique({
        where: { province_id_place_id: { province_id: province.id, place_id } },
      });

      if (cityExists) throw ERR_CITY_ALREADY_EXISTS;
      const city = await prisma.city.create({
        data: { name, latitude, longitude, place_id, province_id: attributes.province_id },
      });

      return city;
    } else {
      throw ERR_INVALID_CITY;
    }
  },

  updateOneCity: async ({ id, attributes }: { id: number; attributes: IUpdateCity }): Promise<City> => {
    const city = await prisma.city.update({
      where: { id },
      data: attributes,
    });
    return city;
  },

  uploadCoverImage: async (data: MultipartFile, id: number) => {
    const filename = data.filename.replace(/\b(\s)\b/g, '-');
    const city = await prisma.city.findUnique({ where: { id } });
    if (city) {
      if (city.img_cover) {
        const filePath = await getFileName(city.img_cover);
        storageServices.deleteFileInStorage(filePath);
      }
      const response = await storageServices.thumbImageUpload({ to: 'cities', file: data.file, filename, id });
      const newImageUrl = `${env_storageBaseUrl}/cities/${id}/${filename}`;
      await prisma.city.update({ where: { id }, data: { img_cover: newImageUrl } });
      return response;
    } else {
      throw ERR_INVALID_CITY;
    }
  },

  deleteOneCity: async ({ id }: { id: number }) => {
    const city = await prisma.city.findUnique({ where: { id } });
    if (city) {
      return await prisma.city
        .delete({
          where: { id },
        })
        .then(() => {
          return { message: 'Cidade excluída com sucesso!' };
        });
    } else {
      throw ERR_CITY_NOT_FOUND;
    }
  },
};

export { citiesServices };
