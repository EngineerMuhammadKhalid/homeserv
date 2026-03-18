export const PAKISTAN_CITIES: Record<string, string[]> = {
  Punjab: [
    'Lahore','Faisalabad','Rawalpindi','Gujranwala','Multan','Sialkot','Sargodha','Bahawalpur','Sheikhupura','Sahiwal','Jhelum','Gujrat','Okara','Rahim Yar Khan','Jhang'
  ],
  Sindh: [
    'Karachi','Hyderabad','Sukkur','Larkana','Nawabshah','Mirpurkhas','Jacobabad','Khairpur'
  ],
  'Khyber Pakhtunkhwa': [
    'Peshawar','Mardan','Abbottabad','Swat (Mingora)','Kohat','Dera Ismail Khan','Charsadda','Nowshera'
  ],
  Balochistan: [
    'Quetta','Gwadar','Turbat','Khuzdar','Sibi','Chaman'
  ],
  'Gilgit-Baltistan': [
    'Gilgit','Skardu','Hunza'
  ],
  'Azad Jammu and Kashmir': [
    'Muzaffarabad','Mirpur','Kotli','Bhimber','Bagh'
  ]
};

export const PROVINCE_LIST = Object.keys(PAKISTAN_CITIES);
