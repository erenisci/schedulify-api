import Gender from '../enums/genderEnum';

type GenderCount = {
  gender: Gender;
  count: number;
};

type NationalityType = {
  _id: string;
  genders: GenderCount[];
  total: number;
};

export default NationalityType;
