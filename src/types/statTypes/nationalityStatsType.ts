import Gender from '../../enums/genderEnum';

type NationalityType = {
  _id: string;
  genders: {
    gender: Gender;
    count: number;
  }[];
  total: number;
};

export default NationalityType;
